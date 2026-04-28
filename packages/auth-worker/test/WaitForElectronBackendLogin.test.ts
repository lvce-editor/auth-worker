import { afterEach, expect, jest, test } from '@jest/globals'
import { AuthProcess } from '@lvce-editor/rpc-registry'
import { waitForElectronBackendLogin } from '../src/parts/WaitForElectronBackendLogin/WaitForElectronBackendLogin.ts'

afterEach(() => {
  jest.restoreAllMocks()
})

test('waitForElectronBackendLogin returns the authorization code and code verifier when the callback arrives', async () => {
  const mockInvoke = jest.spyOn(AuthProcess, 'invoke').mockResolvedValue('auth-code-1' as never)

  const result = await waitForElectronBackendLogin(7, 'verifier-1', 100, 1)

  expect(result).toEqual({
    authCode: 'auth-code-1',
    authCodeVerifier: 'verifier-1',
    authErrorMessage: '',
    userState: 'loggedOut',
  })
  expect(mockInvoke).toHaveBeenCalledWith('OAuthServer.getCode', '7')
})
