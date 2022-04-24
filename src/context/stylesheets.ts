import { compare as compareSpecificity } from 'specificity'
import { nodeIs } from '../utils/node'

export class StyleSheets {
  private rootSvg: Element
  private readonly loadExternalSheets: boolean
  private readonly styleSheets: CSSStyleSheet[]
  private cssValueMap: Map<string, string>
  constructor(rootSvg: Element, loadExtSheets: boolean) {
    this.rootSvg = rootSvg
    this.loadExternalSheets = loadExtSheets
    this.styleSheets = []
    this.cssValueMap = new Map()
  }

  public async load(): Promise<void> {
    const sheetTexts = await this.collectStyleSheetTexts()
    this.parseCssSheets(sheetTexts)
  }

  private async collectStyleSheetTexts(): Promise<string[]> {
    const sheetTexts: (string | null | Promise<string | null>)[] = []

    if (this.loadExternalSheets && this.rootSvg.ownerDocument) {
      for (let i = 0; i < this.rootSvg.ownerDocument.childNodes.length; i++) {
        const node = this.rootSvg.ownerDocument.childNodes[i]
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (node.nodeName === 'xml-stylesheet' && typeof node.data === 'string') {
          sheetTexts.push(
            StyleSheets.loadSheet(
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              node.data
                .match(/href=["'].*?["']/)[0]
                .split('=')[1]
                .slice(1, -1)
            )
          )
        }
      }
    }

    const styleElements = this.rootSvg.querySelectorAll('style,link')
    for (let i = 0; i < styleElements.length; i++) {
      const styleElement = styleElements[i]
      if (nodeIs(styleElement, 'style')) {
        sheetTexts.push(styleElement.textContent)
      } else if (
        this.loadExternalSheets &&
        nodeIs(styleElement, 'link') &&
        styleElement.getAttribute('rel') === 'stylesheet' &&
        styleElement.hasAttribute('href')
      ) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        sheetTexts.push(StyleSheets.loadSheet(styleElement.getAttribute('href')!))
      }
    }

    return (await Promise.all(sheetTexts)).filter((sheet): sheet is string => sheet !== null)
  }

  parseCssSheets(sheetTexts: string[]): void {
    const styleDoc = document.implementation.createHTMLDocument('')
    for (const sheetText of sheetTexts) {
      const style = styleDoc.createElement('style')
      style.textContent = sheetText
      styleDoc.body.appendChild(style)
      const sheet = style.sheet
      if (sheet instanceof CSSStyleSheet) {
        for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
          const cssRule = sheet.cssRules[i]
          if (!(cssRule instanceof CSSStyleRule)) {
            sheet.deleteRule(i)
            continue
          }
          const cssStyleRule = cssRule as CSSStyleRule
          if (cssStyleRule.selectorText.indexOf(',') >= 0) {
            sheet.deleteRule(i)
            const body = cssStyleRule.cssText.substring(cssStyleRule.selectorText.length)
            const selectors = StyleSheets.splitSelectorAtCommas(cssStyleRule.selectorText)
            for (let j = 0; j < selectors.length; j++) {
              sheet.insertRule(selectors[j] + body, i + j)
            }
          }
        }
        this.styleSheets.push(sheet)
      }
    }
  }

  getCssValue(selector: string): string | undefined {
    const value: string = selector
      .replace(/var\(/g, '')
      .replace(/\)/g, '')
      .replace(/^\s+|\s+$/g, '')
    if (this.cssValueMap.get(value)) {
      return this.cssValueMap.get(value)
    }
    for (const sheet of this.styleSheets) {
      for (let i = 0; i < sheet.cssRules.length; i++) {
        const rule = sheet.cssRules[i] as CSSStyleRule
        const res = rule.style.getPropertyValue(value)
        if (res) {
          this.cssValueMap.set(value, res)
          return res
        }
      }
    }
    return undefined
  }

  private static splitSelectorAtCommas(selectorText: string): string[] {
    const initialRegex = /,|["']/g
    const closingDoubleQuotesRegex = /[^\\]["]/g
    const closingSingleQuotesRegex = /[^\\][']/g
    const parts = []

    let state: 'initial' | 'withinQuotes' = 'initial'

    let match
    let lastCommaIndex = -1
    let closingQuotesRegex = closingDoubleQuotesRegex
    for (let i = 0; i < selectorText.length; ) {
      switch (state) {
        case 'initial':
          initialRegex.lastIndex = i
          match = initialRegex.exec(selectorText)
          if (match) {
            if (match[0] === ',') {
              parts.push(
                selectorText.substring(lastCommaIndex + 1, initialRegex.lastIndex - 1).trim()
              )
              lastCommaIndex = initialRegex.lastIndex - 1
            } else {
              state = 'withinQuotes'
              closingQuotesRegex =
                match[0] === '"' ? closingDoubleQuotesRegex : closingSingleQuotesRegex
            }
            i = initialRegex.lastIndex
          } else {
            parts.push(selectorText.substring(lastCommaIndex + 1).trim())
            i = selectorText.length
          }
          break
        case 'withinQuotes':
          closingQuotesRegex.lastIndex = i
          match = closingQuotesRegex.exec(selectorText)
          if (match) {
            i = closingQuotesRegex.lastIndex
            state = 'initial'
          }
          // else this is a syntax error - omit the last part...
          break
      }
    }

    return parts
  }

  private static loadSheet(url: string): Promise<string | null> {
    return (
      new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('GET', url, true)
        xhr.responseType = 'text'

        xhr.onload = (): void => {
          if (xhr.status !== 200) {
            reject(new Error(`Error ${xhr.status}: Failed to load '${url}'`))
          }
          resolve(xhr.responseText)
        }
        xhr.onerror = reject
        xhr.onabort = reject

        xhr.send(null)
      })
        // ignore the error since some stylesheets may not be accessible
        // due to CORS policies
        .catch(() => null)
    )
  }

  getPropertyValue(node: Element, propertyCss: string): string | undefined {
    const matchingRules = []
    for (const sheet of this.styleSheets) {
      for (let i = 0; i < sheet.cssRules.length; i++) {
        const rule = sheet.cssRules[i] as CSSStyleRule
        if (rule.style.getPropertyValue(propertyCss) && node.matches(rule.selectorText)) {
          matchingRules.push(rule)
        }
      }
    }
    if (matchingRules.length === 0) {
      return undefined
    }
    const compare = (a: CSSStyleRule, b: CSSStyleRule): -1 | 0 | 1 => {
      const priorityA = a.style.getPropertyPriority(propertyCss)
      const priorityB = b.style.getPropertyPriority(propertyCss)
      if (priorityA !== priorityB) {
        return priorityA === 'important' ? 1 : -1
      }
      return compareSpecificity(a.selectorText, b.selectorText)
    }
    const mostSpecificRule = matchingRules.reduce((previousValue, currentValue) =>
      compare(previousValue, currentValue) === 1 ? previousValue : currentValue
    )
    let resValue: string = mostSpecificRule.style.getPropertyValue(propertyCss)
    const varReg = /var\(.*?\)/gi
    if (resValue && varReg.test(resValue)) {
      const cssValueList: RegExpMatchArray = resValue.match(varReg) || []
      cssValueList.map(cssValue => {
        const res = this.getCssValue(cssValue)
        if (res) {
          resValue = resValue.replace(cssValue, res.replace(/^\s+|\s+$/g, ''))
        }
      })
    }
    return resValue || undefined
  }
}
