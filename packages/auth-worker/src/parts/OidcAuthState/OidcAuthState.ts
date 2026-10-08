import { clearPersistentAuthValue, getPersistentAuthValue, setPersistentAuthValue } from '../PersistentAuthValue/PersistentAuthValue.ts'

const callbackUrlKey = 'oidcCallbackUrl'
const clientIdKey = 'oidcClientId'
const pendingClientIdKey = 'pendingOidcClientId'
const pendingCodeVerifierKey = 'pendingOidcCodeVerifier'
const pendingRedirectUriKey = 'pendingOidcRedirectUri'
const pendingReturnUrlKey = 'pendingOidcReturnUrl'
const pendingStateKey = 'pendingOidcState'

export interface PendingOidcAuthState {
  readonly clientId: string
  readonly codeVerifier: string
  readonly redirectUri: string
  readonly returnUrl: string
  readonly state: string
}

export const clearOidcCallbackUrl = async (): Promise<void> => {
  await clearPersistentAuthValue(callbackUrlKey)
}

export const clearStoredOidcClientId = async (): Promise<void> => {
  await clearPersistentAuthValue(clientIdKey)
}

export const clearPendingOidcAuthState = async (): Promise<void> => {
  await Promise.all([
    clearPersistentAuthValue(pendingClientIdKey),
    clearPersistentAuthValue(pendingCodeVerifierKey),
    clearPersistentAuthValue(pendingRedirectUriKey),
    clearPersistentAuthValue(pendingReturnUrlKey),
    clearPersistentAuthValue(pendingStateKey),
  ])
}

export const getOidcCallbackUrl = async (): Promise<string> => {
  return getPersistentAuthValue(callbackUrlKey)
}

export const getStoredOidcClientId = async (): Promise<string> => {
  return getPersistentAuthValue(clientIdKey)
}

export const loadPendingOidcAuthState = async (): Promise<PendingOidcAuthState | undefined> => {
  const [clientId, codeVerifier, redirectUri, returnUrl, state] = await Promise.all([
    getPersistentAuthValue(pendingClientIdKey),
    getPersistentAuthValue(pendingCodeVerifierKey),
    getPersistentAuthValue(pendingRedirectUriKey),
    getPersistentAuthValue(pendingReturnUrlKey),
    getPersistentAuthValue(pendingStateKey),
  ])
  if (!clientId || !codeVerifier || !redirectUri || !state) {
    return undefined
  }
  return {
    clientId,
    codeVerifier,
    redirectUri,
    returnUrl,
    state,
  }
}

export const saveOidcCallbackUrl = async (callbackUrl: string): Promise<void> => {
  await setPersistentAuthValue(callbackUrlKey, callbackUrl)
}

export const saveOidcClientId = async (clientId: string): Promise<void> => {
  await setPersistentAuthValue(clientIdKey, clientId)
}

export const savePendingOidcAuthState = async (value: PendingOidcAuthState): Promise<void> => {
  await Promise.all([
    setPersistentAuthValue(pendingClientIdKey, value.clientId),
    setPersistentAuthValue(pendingCodeVerifierKey, value.codeVerifier),
    setPersistentAuthValue(pendingRedirectUriKey, value.redirectUri),
    setPersistentAuthValue(pendingReturnUrlKey, value.returnUrl),
    setPersistentAuthValue(pendingStateKey, value.state),
  ])
}
