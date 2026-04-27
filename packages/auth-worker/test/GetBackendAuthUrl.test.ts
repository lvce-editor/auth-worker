import { expect, test } from '@jest/globals'
import { getBackendAuthUrl } from '../src/parts/GetBackendAuthUrl/GetBackendAuthUrl.ts'

test('getBackendAuthUrl joins the backend url and auth path', () => {
  expect(getBackendAuthUrl('https://api.example.com///', '/auth/login')).toBe('https://api.example.com/auth/login')
})