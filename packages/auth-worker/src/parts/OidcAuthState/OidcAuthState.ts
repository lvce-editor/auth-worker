import { clearPersistentAuthValue, getPersistentAuthValue, setPersistentAuthValue } from '../PersistentAuthValue/PersistentAuthValue.ts'

<<<<<<< HEAD
const callbackUrlKey = 'oidcCallbackUrl'
=======
const accessTokenKey = 'accessToken'
>>>>>>> origin/main
const clientIdKey = 'oidcClientId'
const pendingClientIdKey = 'pendingOidcClientId'
const pendingCodeVerifierKey = 'pendingOidcCodeVerifier'
const pendingRedirectUriKey = 'pendingOidcRedirectUri'
const pendingStateKey = 'pendingOidcState'
<<<<<<< HEAD
=======
const refreshTokenKey = 'refreshToken'
>>>>>>> origin/main

export interface PendingOidcAuthState {
  readonly clientId: string
  readonly codeVerifier: string
  readonly redirectUri: string
  readonly state: string
}

<<<<<<< HEAD
export const clearOidcCallbackUrl = async (): Promise<void> => {
  await clearPersistentAuthValue(callbackUrlKey)
}

export const clearStoredOidcClientId = async (): Promise<void> => {
  await clearPersistentAuthValue(clientIdKey)
=======
export const clearOidcAuthState = async (): Promise<void> => {
  await Promise.all([clearPersistentAuthValue(accessTokenKey), clearPersistentAuthValue(clientIdKey), clearPersistentAuthValue(refreshTokenKey)])
>>>>>>> origin/main
}

export const clearPendingOidcAuthState = async (): Promise<void> => {
  await Promise.all([
    clearPersistentAuthValue(pendingClientIdKey),
    clearPersistentAuthValue(pendingCodeVerifierKey),
    clearPersistentAuthValue(pendingRedirectUriKey),
    clearPersistentAuthValue(pendingStateKey),
  ])
}

<<<<<<< HEAD
export const getOidcCallbackUrl = async (): Promise<string> => {
  return getPersistentAuthValue(callbackUrlKey)
}

=======
>>>>>>> origin/main
export const getStoredOidcClientId = async (): Promise<string> => {
  return getPersistentAuthValue(clientIdKey)
}

export const loadPendingOidcAuthState = async (): Promise<PendingOidcAuthState | undefined> => {
  const [clientId, codeVerifier, redirectUri, state] = await Promise.all([
    getPersistentAuthValue(pendingClientIdKey),
    getPersistentAuthValue(pendingCodeVerifierKey),
    getPersistentAuthValue(pendingRedirectUriKey),
    getPersistentAuthValue(pendingStateKey),
  ])
  if (!clientId || !codeVerifier || !redirectUri || !state) {
    return undefined
  }
  return {
    clientId,
    codeVerifier,
    redirectUri,
    state,
  }
}

<<<<<<< HEAD
export const saveOidcCallbackUrl = async (callbackUrl: string): Promise<void> => {
  await setPersistentAuthValue(callbackUrlKey, callbackUrl)
}

=======
>>>>>>> origin/main
export const saveOidcClientId = async (clientId: string): Promise<void> => {
  await setPersistentAuthValue(clientIdKey, clientId)
}

export const savePendingOidcAuthState = async (value: PendingOidcAuthState): Promise<void> => {
  await Promise.all([
    setPersistentAuthValue(pendingClientIdKey, value.clientId),
    setPersistentAuthValue(pendingCodeVerifierKey, value.codeVerifier),
    setPersistentAuthValue(pendingRedirectUriKey, value.redirectUri),
    setPersistentAuthValue(pendingStateKey, value.state),
  ])
}
