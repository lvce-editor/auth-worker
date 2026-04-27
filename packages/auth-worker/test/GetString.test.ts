import { expect, test } from '@jest/globals'
import { getString } from '../src/parts/GetString/GetString.ts'

test('getString returns string values and fallback values', () => {
  expect(getString('test')).toBe('test')
  expect(getString(7)).toBe('')
  expect(getString(7, 'fallback')).toBe('fallback')
})