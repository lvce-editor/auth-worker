import { expect, test } from '@jest/globals'
import { getBackendRefreshUrl } from '../src/parts/GetBackendRefreshUrl/GetBackendRefreshUrl.ts'

test('getBackendRefreshUrl returns the backend refresh endpoint', () => {
  expect(getBackendRefreshUrl('https://api.example.com/')).toBe('https://api.example.com/auth/refresh')
})
