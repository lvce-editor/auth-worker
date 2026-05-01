import type { LoginResult } from '../HandleClickLoginTypes/HandleClickLoginTypes.ts'
import { exchangeAuthorizationCode } from '../ExchangeAuthorizationCode/ExchangeAuthorizationCode.ts'
import { getCurrentHref } from '../GetCurrentHref/GetCurrentHref.ts'
import { getLoggedOutBackendAuthState } from '../GetLoggedOutBackendAuthState/GetLoggedOutBackendAuthState.ts'
import { getOidcUserName } from '../GetOidcUserName/GetOidcUserName.ts'
<<<<<<< HEAD
import { clearOidcCallbackUrl, clearPendingOidcAuthState, getOidcCallbackUrl, loadPendingOidcAuthState } from '../OidcAuthState/OidcAuthState.ts'
=======
import { clearPendingOidcAuthState, loadPendingOidcAuthState } from '../OidcAuthState/OidcAuthState.ts'
>>>>>>> origin/main

const normalizeRedirectUri = (value: string): string => {
  const url = new URL(value)
  url.hash = ''
  url.search = ''
  return url.toString()
}

<<<<<<< HEAD
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
=======
export const completeBrowserOidcLogin = async (
  backendUrl: string,
  getCurrentHrefFn: () => Promise<string> = getCurrentHref,
): Promise<LoginResult | undefined> => {
  const href = await getCurrentHrefFn()
>>>>>>> origin/main
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
<<<<<<< HEAD
  const error = url.searchParams.get('error') || ''
  const errorDescription = url.searchParams.get('error_description') || ''
=======
  const errorDescription = url.searchParams.get('error_description') || ''
  const error = url.searchParams.get('error') || ''
>>>>>>> origin/main
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
  if (error) {
    await clearPendingOidcAuthState()
    return getLoggedOutBackendAuthState(errorDescription || error)
  }
  const returnedState = url.searchParams.get('state') || ''
  if (!returnedState || returnedState !== pendingAuthState.state) {
    await clearPendingOidcAuthState()
    return getLoggedOutBackendAuthState('Authentication state mismatch.')
  }
<<<<<<< HEAD
  const exchanged = await exchangeAuthorizationCode(
=======
  const tokenResponse = await exchangeAuthorizationCode(
>>>>>>> origin/main
    backendUrl,
    pendingAuthState.clientId,
    code,
    pendingAuthState.redirectUri,
    pendingAuthState.codeVerifier,
  )
<<<<<<< HEAD
  const userName = await getOidcUserName(backendUrl, exchanged.accessToken)
  await clearPendingOidcAuthState()
  return {
    authAccessToken: exchanged.accessToken,
    authClientId: pendingAuthState.clientId,
    authErrorMessage: '',
    authRefreshToken: exchanged.refreshToken,
    userName,
    userState: exchanged.accessToken ? 'loggedIn' : 'loggedOut',
=======
  const userName = await getOidcUserName(backendUrl, tokenResponse.accessToken)
  await clearPendingOidcAuthState()
  return {
    authAccessToken: tokenResponse.accessToken,
    authClientId: pendingAuthState.clientId,
    authErrorMessage: '',
    authRefreshToken: tokenResponse.refreshToken,
    userName,
    userState: tokenResponse.accessToken ? 'loggedIn' : 'loggedOut',
>>>>>>> origin/main
  }
}
