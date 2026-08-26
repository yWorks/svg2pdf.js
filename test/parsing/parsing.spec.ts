import { describe, expect, it } from 'vitest'
import { parseFloats } from '../../src/utils/parsing.ts'

describe('parseFloats', () => {
  it('returns an empty array when the input contains no numbers', () => {
    expect(parseFloats('')).toEqual([])
  })

  it('parses comma-, whitespace-, and sign-separated numbers', () => {
    expect(parseFloats('10, 20 30-40+50')).toEqual([10, 20, 30, -40, 50])
  })

  it('parses integers, decimal forms, and scientific notation', () => {
    expect(parseFloats('1.5 .25 2. 1e3 -2.5E-2 +4e+1')).toEqual([1.5, 0.25, 2, 1000, -0.025, 40])
  })

  it('has linear runtime complexity', { timeout: 100 }, () => {
    expect(parseFloats('1'.repeat(10000) + '!')).to.toHaveLength(1)
  })
})
