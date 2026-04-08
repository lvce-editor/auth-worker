import { createPkceValues } from '../CreatePkceValues/CreatePkceValues.ts'
import { getBackendAuthUrl } from '../GetBackendAuthUrl/GetBackendAuthUrl.ts'
import { getEffectiveRedirectUri } from '../GetEffectiveRedirectUri/GetEffectiveRedirectUri.ts'
export { getCurrentHref } from '../GetCurrentHref/GetCurrentHref.ts'
export { getEffectiveRedirectUri } from '../GetEffectiveRedirectUri/GetEffectiveRedirectUri.ts'
export { getElectronRedirectUri } from '../GetElectronRedirectUri/GetElectronRedirectUri.ts'
import { oidcClientId, oidcScope } from '../OidcConfig/OidcConfig.ts'

export interface BackendLoginRequest {
  readonly codeVerifier: string
  readonly loginUrl: string
  readonly redirectUri: string
}

export const getBackendLoginRequest = async (backendUrl: string, platform = 0, uid = 0, redirectUri = ''): Promise<BackendLoginRequest> => {
  const effectiveRedirectUri = await getEffectiveRedirectUri(platform, uid, redirectUri)
  const { codeChallenge, codeVerifier, nonce, state } = await createPkceValues()
  const loginUrl = new URL(getBackendAuthUrl(backendUrl, '/oidc/auth'))
  loginUrl.searchParams.set('client_id', oidcClientId)
  loginUrl.searchParams.set('code_challenge', codeChallenge)
  loginUrl.searchParams.set('code_challenge_method', 'S256')
  loginUrl.searchParams.set('nonce', nonce)
  loginUrl.searchParams.set('redirect_uri', effectiveRedirectUri)
  loginUrl.searchParams.set('response_type', 'code')
  loginUrl.searchParams.set('scope', oidcScope)
  loginUrl.searchParams.set('state', state)
  return {
    codeVerifier,
    loginUrl: loginUrl.toString(),
    redirectUri: effectiveRedirectUri,
  }
}
