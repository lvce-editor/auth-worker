import { expect, jest, test } from '@jest/globals'

const mockInvoke = jest.fn(async () => 'auth-code-1')

jest.unstable_mockModule('@lvce-editor/rpc-registry', () => ({
  AuthProcess: {
    invoke: mockInvoke,
  },
}))

const { waitForElectronBackendLogin } = await import('../src/parts/WaitForElectronBackendLogin/WaitForElectronBackendLogin.ts')

test('waitForElectronBackendLogin returns the authorization code and code verifier when the callback arrives', async () => {
  const result = await waitForElectronBackendLogin(7, 'verifier-1', 100, 1)

  expect(result).toEqual({
    authCode: 'auth-code-1',
    authCodeVerifier: 'verifier-1',
    authErrorMessage: '',
    userState: 'loggedOut',
  })
  expect(mockInvoke).toHaveBeenCalledWith('OAuthServer.getCode', '7')
})
