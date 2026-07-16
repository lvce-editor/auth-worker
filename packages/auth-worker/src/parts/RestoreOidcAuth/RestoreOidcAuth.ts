import type { LoginResult } from '../HandleClickLoginTypes/HandleClickLoginTypes.ts'
import { getAccessTokenExpiresAt } from '../AccessTokenExpiration/AccessTokenExpiration.ts'
import { getOidcUserName } from '../GetOidcUserName/GetOidcUserName.ts'
import { getStoredOidcClientId } from '../OidcAuthState/OidcAuthState.ts'
import { clearPersistedAuthSession } from '../PersistedAuthSession/PersistedAuthSession.ts'
import { getPersistentAuthValue } from '../PersistentAuthValue/PersistentAuthValue.ts'
import { refreshOidcTokens } from '../RefreshOidcTokens/RefreshOidcTokens.ts'

const clearStoredOidcAuth = async (): Promise<void> => {
  await clearPersistedAuthSession()
}

const toLoginResult = (
  accessToken: string,
  refreshToken: string,
  clientId: string,
  userName: string,
  authAccessTokenExpiresAt?: number,
): LoginResult => {
  return {
    authAccessToken: accessToken,
    ...(authAccessTokenExpiresAt && { authAccessTokenExpiresAt }),
    authClientId: clientId,
    authErrorMessage: '',
    authRefreshToken: refreshToken,
    userName,
    userState: accessToken ? 'loggedIn' : 'loggedOut',
  }
}

export const restoreOidcAuth = async (backendUrl: string): Promise<LoginResult | undefined> => {
  const [accessToken, refreshToken, clientId] = await Promise.all([
    getPersistentAuthValue('accessToken'),
    getPersistentAuthValue('refreshToken'),
    getStoredOidcClientId(),
  ])
  if (!refreshToken || !clientId) {
    return undefined
  }
  try {
    const refreshedTokens = await refreshOidcTokens(backendUrl, clientId, refreshToken)
    const userName = await getOidcUserName(backendUrl, refreshedTokens.accessToken)
    const authAccessTokenExpiresAt = getAccessTokenExpiresAt(refreshedTokens.expiresIn)
    return toLoginResult(refreshedTokens.accessToken, refreshedTokens.refreshToken, clientId, userName, authAccessTokenExpiresAt)
  } catch {
    if (accessToken) {
      const userName = await getOidcUserName(backendUrl, accessToken)
      if (userName) {
        return toLoginResult(accessToken, refreshToken, clientId, userName)
      }
    }
    await clearStoredOidcAuth()
    return undefined
  }
}
