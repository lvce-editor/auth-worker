import { expect, test } from '@jest/globals'
import { waitForElectronBackendLogin } from '../src/parts/WaitForElectronBackendLogin/WaitForElectronBackendLogin.ts'

test('waitForElectronBackendLogin exchanges the authorization code for tokens when the callback arrives', async () => {
  const exchangeCalls: Array<readonly [string, string, string, string, string]> = []
  const result = await waitForElectronBackendLogin(
    'https://api.example.com',
    7,
    'http://localhost:43123/callback',
    'nonce-1',
    'verifier-1',
    100,
    1,
    async () => 'auth-code-1',
    async (backendUrl, code, redirectUri, codeVerifier, nonce) => {
      exchangeCalls.push([backendUrl, code, redirectUri, codeVerifier, nonce])
      return {
        accessToken: 'access-token-1',
        refreshToken: 'refresh-token-1',
      }
    },
  )

  expect(result).toEqual({
    authAccessToken: 'access-token-1',
    authErrorMessage: '',
    authRefreshToken: 'refresh-token-1',
    userState: 'loggedIn',
  })
  expect(exchangeCalls).toEqual([['https://api.example.com', 'auth-code-1', 'http://localhost:43123/callback', 'verifier-1', 'nonce-1']])
})
