import { expect, test } from '@jest/globals'
import { trimTrailingSlashes } from '../src/parts/TrimTrailingSlashes/TrimTrailingSlashes.ts'

test('trimTrailingSlashes removes trailing slashes only', () => {
  expect(trimTrailingSlashes('https://example.com///')).toBe('https://example.com')
  expect(trimTrailingSlashes('https://example.com/path')).toBe('https://example.com/path')
})
