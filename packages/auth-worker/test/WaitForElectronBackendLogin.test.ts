import { expect, test } from '@jest/globals'
import { waitForElectronBackendLogin } from '../src/parts/WaitForElectronBackendLogin/WaitForElectronBackendLogin.ts'

test('waitForElectronBackendLogin exchanges the authorization code for tokens when the callback arrives', async () => {
  const exchangeCalls: Array<readonly [string, string, string, string]> = []
  const userNameCalls: Array<readonly [string, string]> = []
  const result = await waitForElectronBackendLogin(
    'https://api.example.com',
    7,
    'http://localhost:43123/callback',
    'verifier-1',
    100,
    1,
    async () => 'auth-code-1',
    async (backendUrl, code, redirectUri, codeVerifier) => {
      exchangeCalls.push([backendUrl, code, redirectUri, codeVerifier])
      return {
        accessToken: 'access-token-1',
        expiresIn: undefined,
        refreshToken: 'refresh-token-1',
      }
    },
    async (backendUrl, accessToken) => {
      userNameCalls.push([backendUrl, accessToken])
      return 'Test User'
    },
  )

  expect(result).toEqual({
    authAccessToken: 'access-token-1',
    authErrorMessage: '',
    authRefreshToken: 'refresh-token-1',
    userName: 'Test User',
    userState: 'loggedIn',
  })
  expect(exchangeCalls).toEqual([['https://api.example.com', 'auth-code-1', 'http://localhost:43123/callback', 'verifier-1']])
  expect(userNameCalls).toEqual([['https://api.example.com', 'access-token-1']])
})
