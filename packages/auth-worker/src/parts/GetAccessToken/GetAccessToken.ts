import { getAccessTokenExpiresAt, isAccessTokenValid } from '../AccessTokenExpiration/AccessTokenExpiration.ts'
import { getAuthBackendUrl } from '../AuthBackendUrl/AuthBackendUrl.ts'
import { getStoredOidcClientId } from '../OidcAuthState/OidcAuthState.ts'
import { getPersistentAuthValue, setPersistentAuthValue } from '../PersistentAuthValue/PersistentAuthValue.ts'
import { refreshOidcTokens, type RefreshOidcTokensResult } from '../RefreshOidcTokens/RefreshOidcTokens.ts'

export interface GetAccessTokenOptions {
  readonly refresh?: 'if-needed'
}

export const getAccessToken = async (
  options: GetAccessTokenOptions = {},
  refreshTokens: (backendUrl: string, clientId: string, refreshToken: string) => Promise<RefreshOidcTokensResult> = refreshOidcTokens,
  now = Date.now(),
): Promise<string> => {
  const [accessToken, accessTokenExpiresAt] = await Promise.all([
    getPersistentAuthValue('accessToken'),
    getPersistentAuthValue('accessTokenExpiresAt'),
  ])
  if (options.refresh !== 'if-needed' || isAccessTokenValid(accessToken, accessTokenExpiresAt, now)) {
    return accessToken
  }
  const [clientId, refreshToken] = await Promise.all([getStoredOidcClientId(), getPersistentAuthValue('refreshToken')])
  const backendUrl = getAuthBackendUrl()
  if (!backendUrl || !clientId || !refreshToken) {
    return accessToken
  }
  const refreshedTokens = await refreshTokens(backendUrl, clientId, refreshToken)
  const expiresAt = getAccessTokenExpiresAt(refreshedTokens.expiresIn, now)
  await Promise.all([
    setPersistentAuthValue('accessToken', refreshedTokens.accessToken),
    setPersistentAuthValue('accessTokenExpiresAt', typeof expiresAt === 'number' ? String(expiresAt) : ''),
    setPersistentAuthValue('refreshToken', refreshedTokens.refreshToken),
  ])
  return refreshedTokens.accessToken
}
