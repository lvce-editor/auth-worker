import type { LoginResult } from '../HandleClickLoginTypes/HandleClickLoginTypes.ts'
import { getAccessTokenExpiresAt } from '../AccessTokenExpiration/AccessTokenExpiration.ts'
import { exchangeAuthorizationCode } from '../ExchangeAuthorizationCode/ExchangeAuthorizationCode.ts'
import { getCurrentHref } from '../GetCurrentHref/GetCurrentHref.ts'
import { getLoggedOutBackendAuthState } from '../GetLoggedOutBackendAuthState/GetLoggedOutBackendAuthState.ts'
import { getOidcUserName } from '../GetOidcUserName/GetOidcUserName.ts'
import { clearOidcCallbackUrl, clearPendingOidcAuthState, getOidcCallbackUrl, loadPendingOidcAuthState } from '../OidcAuthState/OidcAuthState.ts'

const normalizeRedirectUri = (value: string): string => {
  const url = new URL(value)
  url.hash = ''
  url.search = ''
  return url.href
}

const getCallbackHref = async (): Promise<string> => {
  const storedCallbackUrl = await getOidcCallbackUrl()
  if (storedCallbackUrl) {
    await clearOidcCallbackUrl()
    return storedCallbackUrl
  }
  return getCurrentHref()
}

export const completeBrowserOidcLogin = async (backendUrl: string): Promise<LoginResult | undefined> => {
  const href = await getCallbackHref()
  if (!href) {
    return undefined
  }
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return undefined
  }
  const code = url.searchParams.get('code') || ''
  const error = url.searchParams.get('error') || ''
  if (!code && !error) {
    return undefined
  }
  const pendingAuthState = await loadPendingOidcAuthState()
  if (!pendingAuthState) {
    await clearPendingOidcAuthState()
    return getLoggedOutBackendAuthState('Authentication state is missing.')
  }
  if (normalizeRedirectUri(href) !== normalizeRedirectUri(pendingAuthState.redirectUri)) {
    await clearPendingOidcAuthState()
    return getLoggedOutBackendAuthState('Authentication returned to an unexpected redirect URI.')
  }
  const errorDescription = url.searchParams.get('error_description') || ''
  if (error) {
    await clearPendingOidcAuthState()
    return getLoggedOutBackendAuthState(errorDescription || error)
  }
  const returnedState = url.searchParams.get('state') || ''
  if (!returnedState || returnedState !== pendingAuthState.state) {
    await clearPendingOidcAuthState()
    return getLoggedOutBackendAuthState('Authentication state mismatch.')
  }
  const exchanged = await exchangeAuthorizationCode(
    backendUrl,
    pendingAuthState.clientId,
    code,
    pendingAuthState.redirectUri,
    pendingAuthState.codeVerifier,
  )
  const userName = await getOidcUserName(backendUrl, exchanged.accessToken)
  const authAccessTokenExpiresAt = getAccessTokenExpiresAt(exchanged.expiresIn)
  await clearPendingOidcAuthState()
  return {
    authAccessToken: exchanged.accessToken,
    ...(authAccessTokenExpiresAt && { authAccessTokenExpiresAt }),
    authClientId: pendingAuthState.clientId,
    authErrorMessage: '',
    authRefreshToken: exchanged.refreshToken,
    userName,
    userState: exchanged.accessToken ? 'loggedIn' : 'loggedOut',
  }
}
