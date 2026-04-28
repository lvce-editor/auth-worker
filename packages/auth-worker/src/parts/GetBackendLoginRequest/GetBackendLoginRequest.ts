<<<<<<< HEAD
import { createUrl } from '../CreateUrl/CreateUrl.ts'
=======
// cspell:ignore pkce

import { createPkceValues } from '../CreatePkceValues/CreatePkceValues.ts'
import { getBackendAuthUrl } from '../GetBackendAuthUrl/GetBackendAuthUrl.ts'
>>>>>>> origin/main
import { getEffectiveRedirectUri } from '../GetEffectiveRedirectUri/GetEffectiveRedirectUri.ts'
import { oidcClientId, oidcScope } from '../OidcConfig/OidcConfig.ts'

export interface BackendLoginRequest {
  readonly codeVerifier: string
  readonly loginUrl: string
  readonly redirectUri: string
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
<<<<<<< HEAD
  return {
    loginUrl: createUrl({
      baseUrl: backendUrl,
      params: effectiveRedirectUri
        ? {
            redirect_uri: effectiveRedirectUri,
          }
        : {},
      path: '/login',
    }),
=======
  const { codeChallenge, codeVerifier } = await createPkceValuesFn()
  const loginUrl = new URL(getBackendAuthUrl(backendUrl, '/oidc/auth'))
  loginUrl.searchParams.set('client_id', oidcClientId)
  loginUrl.searchParams.set('code_challenge', codeChallenge)
  loginUrl.searchParams.set('code_challenge_method', 'S256')
  loginUrl.searchParams.set('nonce', createRandomUuid())
  loginUrl.searchParams.set('prompt', 'consent')
  loginUrl.searchParams.set('response_type', 'code')
  loginUrl.searchParams.set('scope', oidcScope)
  loginUrl.searchParams.set('state', createRandomUuid())
  if (effectiveRedirectUri) {
    loginUrl.searchParams.set('redirect_uri', effectiveRedirectUri)
  }
  return {
    codeVerifier,
    loginUrl: loginUrl.toString(),
>>>>>>> origin/main
    redirectUri: effectiveRedirectUri,
  }
}
