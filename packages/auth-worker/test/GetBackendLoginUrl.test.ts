import { expect, test } from '@jest/globals'
import { getBackendLoginUrl } from '../src/parts/GetBackendLoginUrl/GetBackendLoginUrl.ts'

test('getBackendLoginUrl returns the backend login endpoint', () => {
  expect(getBackendLoginUrl('https://api.example.com/')).toBe('https://api.example.com/auth/login')
})