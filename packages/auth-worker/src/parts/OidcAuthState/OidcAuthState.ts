import { clearPersistentAuthValue, getPersistentAuthValue, setPersistentAuthValue } from '../PersistentAuthValue/PersistentAuthValue.ts'

const accessTokenKey = 'accessToken'
const clientIdKey = 'oidcClientId'
const pendingClientIdKey = 'pendingOidcClientId'
const pendingCodeVerifierKey = 'pendingOidcCodeVerifier'
const pendingRedirectUriKey = 'pendingOidcRedirectUri'
const pendingStateKey = 'pendingOidcState'
const refreshTokenKey = 'refreshToken'

export interface PendingOidcAuthState {
  readonly clientId: string
  readonly codeVerifier: string
  readonly redirectUri: string
  readonly state: string
}

export const clearOidcAuthState = async (): Promise<void> => {
  await Promise.all([clearPersistentAuthValue(accessTokenKey), clearPersistentAuthValue(clientIdKey), clearPersistentAuthValue(refreshTokenKey)])
}

export const clearPendingOidcAuthState = async (): Promise<void> => {
  await Promise.all([
    clearPersistentAuthValue(pendingClientIdKey),
    clearPersistentAuthValue(pendingCodeVerifierKey),
    clearPersistentAuthValue(pendingRedirectUriKey),
    clearPersistentAuthValue(pendingStateKey),
  ])
}

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
