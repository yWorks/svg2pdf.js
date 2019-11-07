declare module 'font-family-papandreou' {
  interface Options {
    quote?: string
  }

  export default class FontFamily {
    static parse(str: string): string[]
    static stringify(names: string[], options: Options): string
  }
}
