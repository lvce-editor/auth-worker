import { expect, test } from '@jest/globals'
import { waitForElectronBackendLogin } from '../src/parts/WaitForElectronBackendLogin/WaitForElectronBackendLogin.ts'

test('waitForElectronBackendLogin returns the authorization code and code verifier when the callback arrives', async () => {
  const result = await waitForElectronBackendLogin(7, 'verifier-1', 100, 1, async () => 'auth-code-1')

  expect(result).toEqual({
    authCode: 'auth-code-1',
    authCodeVerifier: 'verifier-1',
    authErrorMessage: '',
    userState: 'loggedOut',
  })
})
