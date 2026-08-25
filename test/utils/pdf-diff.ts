const MAX_CONTEXT = 2048
const DIFF_CONTEXT_LINES = 3
const MAX_OUTPUT = 16384

function hex(byte: number): string {
  const value = byte.toString(16)
  return value.length === 1 ? `0${value}` : value
}

function display(byte: number): string {
  if (byte === 10) return '\\n'
  if (byte === 13) return '\\r'
  if (byte === 9) return '\\t'
  if (byte >= 32 && byte <= 126) return String.fromCharCode(byte)
  return `\\x${hex(byte)}`
}

function snippet(bytes: Uint8Array, start: number, end: number): string {
  let result = ''
  for (let i = start; i < end; i++) result += display(bytes[i])
  return result
}

function escapedText(bytes: Uint8Array): string {
  return snippet(bytes, 0, bytes.length)
}

function escapedLines(bytes: Uint8Array): string[] {
  const lines: string[] = []
  let line = ''
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 10) {
      lines.push(line)
      line = ''
    } else {
      line += display(bytes[i])
    }
  }
  lines.push(line)
  return lines
}

function firstLineIndex(bytes: Uint8Array, offset: number): number {
  let line = 0
  for (let i = 0; i < offset && i < bytes.length; i++) {
    if (bytes[i] === 10) line++
  }
  return line
}

function unifiedTextDiff(expected: Uint8Array, actual: Uint8Array, offset: number): string {
  const expectedLines = escapedLines(expected)
  const actualLines = escapedLines(actual)
  const expectedLine = firstLineIndex(expected, offset)
  const actualLine = firstLineIndex(actual, offset)
  const start = Math.max(0, Math.min(expectedLine, actualLine) - DIFF_CONTEXT_LINES)
  const expectedWindow = expectedLines.slice(start, expectedLine + DIFF_CONTEXT_LINES + 1)
  const actualWindow = actualLines.slice(start, actualLine + DIFF_CONTEXT_LINES + 1)
  const rows: number[][] = []
  for (let i = 0; i <= expectedWindow.length; i++) {
    rows[i] = []
    for (let j = 0; j <= actualWindow.length; j++) {
      rows[i][j] =
        i === 0 || j === 0
          ? 0
          : expectedWindow[i - 1] === actualWindow[j - 1]
            ? rows[i - 1][j - 1] + 1
            : Math.max(rows[i - 1][j], rows[i][j - 1])
    }
  }
  const result: string[] = []
  let i = expectedWindow.length
  let j = actualWindow.length
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && expectedWindow[i - 1] === actualWindow[j - 1]) {
      result.unshift(`  ${expectedWindow[i - 1]}`)
      i--
      j--
    } else if (j > 0 && (i === 0 || rows[i][j - 1] >= rows[i - 1][j])) {
      result.unshift(`+ ${actualWindow[j - 1]}`)
      j--
    } else {
      result.unshift(`- ${expectedWindow[i - 1]}`)
      i--
    }
  }
  return result.join('\n')
}

export function equalBytes(expected: Uint8Array, actual: Uint8Array): number {
  const length = Math.min(expected.length, actual.length)
  for (let i = 0; i < length; i++) {
    if (expected[i] !== actual[i]) return i
  }
  return expected.length === actual.length ? -1 : length
}

export function pdfDiff(
  path: string,
  expected: Uint8Array | undefined,
  actual: Uint8Array
): string {
  const expectedBytes = expected ?? new Uint8Array(0)
  const offset = equalBytes(expectedBytes, actual)
  const expectedByte = expectedBytes[offset] ?? 0
  const actualByte = actual[offset] ?? 0
  let message = `PDF snapshot ${expected ? 'mismatch' : 'missing'}: ${path}\n`
  message += `Expected: ${expected ? expected.length.toLocaleString() : 'missing'} bytes\n`
  message += `Received: ${actual.length.toLocaleString()} bytes\n`
  if (expected) {
    message += `First differing byte: offset ${offset} (expected 0x${hex(expectedByte)} "${display(expectedByte)}", received 0x${hex(actualByte)} "${display(actualByte)}")\n`
  }
  message += 'PDF text diff (three lines of context):\n'
  if (expected) message += unifiedTextDiff(expectedBytes, actual, offset)
  else message += `+ ${escapedText(actual).slice(0, MAX_CONTEXT)}`
  return message.length > MAX_OUTPUT
    ? `${message.slice(0, MAX_OUTPUT - 18)}\n...[truncated]`
    : message
}
