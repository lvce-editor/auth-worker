import { expect, test } from '@jest/globals'
import { getBackendLogoutUrl } from '../src/parts/GetBackendLogoutUrl/GetBackendLogoutUrl.ts'

test('getBackendLogoutUrl returns the backend logout endpoint', () => {
  expect(getBackendLogoutUrl('https://api.example.com/')).toBe('https://api.example.com/auth/logout')
})