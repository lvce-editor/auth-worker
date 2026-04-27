import { expect, test } from '@jest/globals'
import { getNumber } from '../src/parts/GetNumber/GetNumber.ts'

test('getNumber returns numeric values and fallback values', () => {
  expect(getNumber(7)).toBe(7)
  expect(getNumber('7')).toBe(0)
  expect(getNumber('7', 42)).toBe(42)
})
