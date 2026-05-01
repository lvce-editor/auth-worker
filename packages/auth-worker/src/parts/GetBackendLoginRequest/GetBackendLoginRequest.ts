import { createPkceValues } from '../CreatePkceValues/CreatePkceValues.ts'
// cspell:ignore pkce
import { getBackendAuthUrl } from '../GetBackendAuthUrl/GetBackendAuthUrl.ts'
import { getEffectiveRedirectUri } from '../GetEffectiveRedirectUri/GetEffectiveRedirectUri.ts'
import { getOidcClientId, oidcScope } from '../OidcConfig/OidcConfig.ts'

export interface BackendLoginRequest {
  readonly clientId: string
  readonly codeVerifier: string
  readonly loginUrl: string
  readonly nonce: string
  readonly redirectUri: string
  readonly state: string
}

export const getBackendLoginRequest = async (
  backendUrl: string,
  platform = 0,
  uid = 0,
  redirectUri = '',
  createPkceValuesFn: () => Promise<{ codeChallenge: string; codeVerifier: string }> = createPkceValues,
  createRandomUuid: () => string = () => globalThis.crypto.randomUUID(),
): Promise<BackendLoginRequest> => {
  const effectiveRedirectUri = await getEffectiveRedirectUri(platform, uid, redirectUri)
  const { codeChallenge, codeVerifier } = await createPkceValuesFn()
  const clientId = getOidcClientId(platform)
  const nonce = createRandomUuid()
  const state = createRandomUuid()
  const loginUrl = new URL(getBackendAuthUrl(backendUrl, '/oidc/auth'))
  loginUrl.searchParams.set('client_id', clientId)
  loginUrl.searchParams.set('code_challenge', codeChallenge)
  loginUrl.searchParams.set('code_challenge_method', 'S256')
  loginUrl.searchParams.set('nonce', nonce)
  loginUrl.searchParams.set('prompt', 'consent')
  loginUrl.searchParams.set('response_type', 'code')
  loginUrl.searchParams.set('scope', oidcScope)
  loginUrl.searchParams.set('state', state)
  if (effectiveRedirectUri) {
    loginUrl.searchParams.set('redirect_uri', effectiveRedirectUri)
  }
  return {
    clientId,
    codeVerifier,
    loginUrl: loginUrl.toString(),
    nonce,
    redirectUri: effectiveRedirectUri,
    state,
  }
}
