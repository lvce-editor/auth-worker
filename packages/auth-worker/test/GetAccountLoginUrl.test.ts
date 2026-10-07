import { expect, test } from '@jest/globals'
import { getAccountLoginUrl } from '../src/parts/GetAccountLoginUrl/GetAccountLoginUrl.ts'

test('additional login requests the account chooser and preserves the complete OIDC request', () => {
  const authorizationUrl = 'https://backend.test/oidc/auth?state=state-A&code_challenge=challenge-A&redirect_uri=https%3A%2F%2Feditor.test%2F'
  const url = new URL(getAccountLoginUrl('https://backend.test/', authorizationUrl))
  expect(url.pathname).toBe('/login')
  expect(url.searchParams.get('selectAccount')).toBe('true')
  expect(url.searchParams.get('returnTo')).toBe(authorizationUrl)
})
