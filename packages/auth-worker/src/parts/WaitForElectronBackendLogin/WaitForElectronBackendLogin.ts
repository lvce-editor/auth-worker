import { AuthProcess } from '@lvce-editor/rpc-registry'
import type { LoginResult } from '../HandleClickLoginTypes/HandleClickLoginTypes.ts'
import { getAccessTokenExpiresAt } from '../AccessTokenExpiration/AccessTokenExpiration.ts'
import { delay } from '../Delay/Delay.ts'
import { exchangeElectronAuthorizationCode } from '../ExchangeElectronAuthorizationCode/ExchangeElectronAuthorizationCode.ts'
import { getLoggedOutBackendAuthState } from '../GetLoggedOutBackendAuthState/GetLoggedOutBackendAuthState.ts'

const hasAuthorizationCode = (value: unknown): value is string => {
  return typeof value === 'string' && value.length > 0
}

const getElectronAuthorizationCode = async (uid: number): Promise<unknown> => {
  return AuthProcess.invoke('OAuthServer.getCode', String(uid))
}

export const waitForElectronBackendLogin = async (
  backendUrl: string,
  uid: number,
  redirectUri: string,
  codeVerifier: string,
  timeoutMs = 30_000,
  pollIntervalMs = 1000,
  getAuthorizationCode: (uid: number) => Promise<unknown> = getElectronAuthorizationCode,
  exchangeAuthorizationCode: (
    backendUrl: string,
    code: string,
    redirectUri: string,
    codeVerifier: string,
  ) => Promise<{ accessToken: string; expiresIn: number | undefined; refreshToken: string }> = exchangeElectronAuthorizationCode,
): Promise<LoginResult> => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const authorizationCode = await getAuthorizationCode(uid)
    if (hasAuthorizationCode(authorizationCode)) {
      const tokenResponse = await exchangeAuthorizationCode(backendUrl, authorizationCode, redirectUri, codeVerifier)
      const authAccessTokenExpiresAt = getAccessTokenExpiresAt(tokenResponse.expiresIn)
      return {
        authAccessToken: tokenResponse.accessToken,
        ...(authAccessTokenExpiresAt && { authAccessTokenExpiresAt }),
        authErrorMessage: '',
        authRefreshToken: tokenResponse.refreshToken,
        userState: tokenResponse.accessToken ? 'loggedIn' : 'loggedOut',
      }
    }
    await delay(pollIntervalMs)
  }
  return getLoggedOutBackendAuthState('Timed out waiting for backend login.')
}
