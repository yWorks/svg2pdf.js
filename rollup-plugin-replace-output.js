export default function rollupPluginReplaceOutput(replacements) {
  return {
    name: 'rollup-plugin-replace-output',
    renderChunk(code, chunk) {
      replacements.forEach(({ include, search, replace }) => {
        if (include.test(chunk.fileName)) {
          code = code.replace(search, replace)
        }
      })

      return code
    }
  }
}
