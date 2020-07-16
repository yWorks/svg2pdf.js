import Css from 'css'
import CssSelect from 'css-select'
import BrowserDomAdapter from 'css-select-browser-adapter'

export class StyleSheets {
  private rootSvg: HTMLElement
  private loadExtSheets: boolean
  private sheets: any[]
  private selectorMap: { [selector: string]: Function }

  constructor(rootSvg: HTMLElement, loadExtSheets: boolean) {
    this.rootSvg = rootSvg
    this.loadExtSheets = loadExtSheets
    this.sheets = []
    this.selectorMap = {}
  }

  private getParsedSheets() {
    if (this.sheets.length === 0) {
      const sheetTexts = []

      const styleTags: any = this.rootSvg.getElementsByTagName('style') || []
      for (let styleTag of styleTags) {
        sheetTexts.push(styleTag.textContent)
      }

      if (this.loadExtSheets) {
        const paths = []
        const links: any = this.rootSvg.getElementsByTagName('link')
        for (const link of links) {
          if (link.getAttribute('rel') === 'stylesheet') {
            paths.push(link.getAttribute('href'))
          }
        }

        let node: any
        if (this.rootSvg.ownerDocument) {
          for (node of this.rootSvg.ownerDocument.childNodes as any) {
            if (node.nodeName === 'xml-stylesheet') {
              paths.push(
                node.data
                  .match(/href=[\"|\'|\`|\`].*?[\"|\'|\`|\`]/)[0]
                  .split('=')[1]
                  .slice(1, -1)
              )
            }
          }
        }

        for (const path of paths) {
          const response = StyleSheets.loadSheet(path)
          if (!(response instanceof Error)) {
            sheetTexts.push(response)
          }
        }
      }

      for (const text of sheetTexts) {
        const sheet = Css.parse(text, { silent: true })
        this.sheets.push(sheet)
      }
    }
    return this.sheets
  }

  private static loadSheet(url: string) {
    const request = new XMLHttpRequest()
    request.open('GET', url, false)
    request.overrideMimeType('text/plain; charset=x-user-defined')
    request.send()

    if (request.status !== 200) {
      return new Error(`Unable to fetch ${url}, status code: ${request.status}`)
    }

    return request.responseText
  }

  getRuleFor(node: HTMLElement, propertyCss: string) {
    for (const sheet of this.getParsedSheets()) {
      for (const rule of sheet.stylesheet.rules) {
        for (const selector of rule.selectors) {
          if (this.getCompiledRule(selector)(node, selector)) {
            for (const declaration of rule.declarations) {
              if (declaration.property === propertyCss) {
                return declaration.value
              }
            }
          }
        }
      }
    }
    return null
  }

  private getCompiledRule(selector: string) {
    return (
      this.selectorMap[selector] ||
      // @ts-ignore
      (this.selectorMap[selector] = CssSelect.compile(selector, { adapter: BrowserDomAdapter }))
    )
  }
}
