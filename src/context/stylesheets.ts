import { compare as compareSpecificity } from 'specificity'
import { nodeIs } from '../utils/node'

export class StyleSheets {
  private rootSvg: Element
  private readonly loadExternalSheets: boolean
  private readonly styleSheets: CSSStyleSheet[]
  constructor(rootSvg: Element, loadExtSheets: boolean) {
    this.rootSvg = rootSvg
    this.loadExternalSheets = loadExtSheets
    this.styleSheets = []
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
    const getPropertyCssValue = (propertyCss: string): string => {
      //Screening fallback
      let propertyValue =
        propertyCss.indexOf('var(') == -1
          ? mostSpecificRule.style.getPropertyValue(propertyCss.trim())
          : propertyCss
      const cssVariables: {
        text: string //Varlables text
        fallback: string // Varlables fallback
        key: string //Varlables key
      }[] = []
      for (
        let index = propertyValue.indexOf('var('), left = index + 4, bracketsLevels = 0;
        index < propertyValue.length;

      ) {
        // not found
        if (index < 0) {
          break
        }
        if (propertyValue.charAt(index) === ')') bracketsLevels--
        else if (propertyValue.charAt(index) === '(') bracketsLevels++
        if (bracketsLevels == 0 && index > left) {
          const text = propertyValue.substring(left - 4, index + 1)
          const inner = text.substring(4, text.length - 1)
          const separator = inner.indexOf(',')
          const length = inner.length
          const sp = separator < 0 ? length : separator
          cssVariables.push({
            text, //var(--one,var(--two,rgb(1,1,1)))
            fallback: inner.substring(sp + 1), //var(--two,rgb(1,1,1))
            key: inner.substring(0, sp).trim() //--one
          })
          //Process the next css Varlables
          index = propertyValue.indexOf('var(', index)
          left = index + 4
          continue
        }
        index++
      }
      if (cssVariables.length === 0) {
        //propertyCss is a  normal cssValue return itself
        //propertyCss is a cssVariable key return getPropertyValue()
        return propertyValue || propertyCss.startsWith('--') ? propertyValue : propertyCss
      }
      cssVariables.map(v => {
        const value = getPropertyCssValue(v.key)
        // Detect the need for fallback
        propertyValue = propertyValue.replace(
          v.text,
          value ? value : getPropertyCssValue(v.fallback)
        )
      })
      return propertyValue
    }

    return getPropertyCssValue(propertyCss) || undefined
  }
}
