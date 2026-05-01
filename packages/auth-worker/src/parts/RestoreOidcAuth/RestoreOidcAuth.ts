import type { LoginResult } from '../HandleClickLoginTypes/HandleClickLoginTypes.ts'
<<<<<<< HEAD
import { getOidcUserName } from '../GetOidcUserName/GetOidcUserName.ts'
import { clearStoredOidcClientId, getStoredOidcClientId } from '../OidcAuthState/OidcAuthState.ts'
import { clearPersistentAuthValue, getPersistentAuthValue } from '../PersistentAuthValue/PersistentAuthValue.ts'
import { refreshOidcTokens } from '../RefreshOidcTokens/RefreshOidcTokens.ts'

const clearStoredOidcAuth = async (): Promise<void> => {
  await Promise.all([clearPersistentAuthValue('accessToken'), clearPersistentAuthValue('refreshToken'), clearStoredOidcClientId()])
}

=======
import { getLoggedOutBackendAuthState } from '../GetLoggedOutBackendAuthState/GetLoggedOutBackendAuthState.ts'
import { getOidcUserName } from '../GetOidcUserName/GetOidcUserName.ts'
import { clearOidcAuthState, getStoredOidcClientId } from '../OidcAuthState/OidcAuthState.ts'
import { getPersistentAuthValue } from '../PersistentAuthValue/PersistentAuthValue.ts'
import { refreshOidcTokens } from '../RefreshOidcTokens/RefreshOidcTokens.ts'

>>>>>>> origin/main
const toLoginResult = (accessToken: string, refreshToken: string, clientId: string, userName: string): LoginResult => {
  return {
    authAccessToken: accessToken,
    authClientId: clientId,
    authErrorMessage: '',
    authRefreshToken: refreshToken,
    userName,
    userState: accessToken ? 'loggedIn' : 'loggedOut',
  }
}

export const restoreOidcAuth = async (backendUrl: string): Promise<LoginResult | undefined> => {
<<<<<<< HEAD
  const [accessToken, refreshToken, clientId] = await Promise.all([
=======
  const [storedAccessToken, storedRefreshToken, storedClientId] = await Promise.all([
>>>>>>> origin/main
    getPersistentAuthValue('accessToken'),
    getPersistentAuthValue('refreshToken'),
    getStoredOidcClientId(),
  ])
<<<<<<< HEAD
  if (!refreshToken || !clientId) {
    return undefined
  }
  try {
    const refreshedTokens = await refreshOidcTokens(backendUrl, clientId, refreshToken)
    const userName = await getOidcUserName(backendUrl, refreshedTokens.accessToken)
    return toLoginResult(refreshedTokens.accessToken, refreshedTokens.refreshToken, clientId, userName)
  } catch {
    if (accessToken) {
      const userName = await getOidcUserName(backendUrl, accessToken)
      if (userName) {
        return toLoginResult(accessToken, refreshToken, clientId, userName)
      }
    }
    await clearStoredOidcAuth()
    return undefined
=======
  if (!storedRefreshToken || !storedClientId) {
    return undefined
  }
  try {
    const refreshedTokens = await refreshOidcTokens(backendUrl, storedClientId, storedRefreshToken)
    const userName = await getOidcUserName(backendUrl, refreshedTokens.accessToken)
    return toLoginResult(refreshedTokens.accessToken, refreshedTokens.refreshToken, storedClientId, userName)
  } catch (error) {
    if (storedAccessToken) {
      const userName = await getOidcUserName(backendUrl, storedAccessToken)
      if (userName) {
        return toLoginResult(storedAccessToken, storedRefreshToken, storedClientId, userName)
      }
    }
    await clearOidcAuthState()
    const authErrorMessage = error instanceof Error && error.message ? error.message : 'Backend authentication failed.'
    return getLoggedOutBackendAuthState(authErrorMessage)
>>>>>>> origin/main
  }
}
