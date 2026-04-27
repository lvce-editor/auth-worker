import { expect, test } from '@jest/globals'
import { getBackendNativeExchangeUrl } from '../src/parts/GetBackendNativeExchangeUrl/GetBackendNativeExchangeUrl.ts'

test('getBackendNativeExchangeUrl returns the backend native exchange endpoint', () => {
  expect(getBackendNativeExchangeUrl('https://api.example.com/')).toBe('https://api.example.com/auth/native/exchange')
})