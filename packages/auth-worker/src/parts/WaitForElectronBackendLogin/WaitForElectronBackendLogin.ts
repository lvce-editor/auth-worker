import { AuthProcess } from '@lvce-editor/rpc-registry'
import type { LoginResult } from '../HandleClickLogin/HandleClickLogin.ts'
import { delay } from '../Delay/Delay.ts'
import { getLoggedOutBackendAuthState } from '../GetLoggedOutBackendAuthState/GetLoggedOutBackendAuthState.ts'

const hasAuthorizationCode = (value: unknown): boolean => {
  return typeof value === 'string' && value.length > 0
}

export const waitForElectronBackendLogin = async (
  uid: number,
  codeVerifier: string,
  timeoutMs = 30_000,
  pollIntervalMs = 1000,
): Promise<LoginResult> => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const authorizationCode = await AuthProcess.invoke('OAuthServer.getCode', String(uid))
    if (hasAuthorizationCode(authorizationCode)) {
      return {
        authCode: authorizationCode,
        authCodeVerifier: codeVerifier,
        authErrorMessage: '',
        userState: 'loggedOut',
      }
    }
    await delay(pollIntervalMs)
  }
  return getLoggedOutBackendAuthState('Timed out waiting for backend login.')
}
