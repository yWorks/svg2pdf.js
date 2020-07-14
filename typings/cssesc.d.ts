declare module 'cssesc' {
  interface Options {
    escapeEverything?: boolean
    isIdentifier?: boolean
    quotes?: string
    wrap?: boolean
  }

  function cssesc(string: string, options: Options): string
  namespace cssesc {
    let options: Options
    const version: string
  }

  export default cssesc
}
