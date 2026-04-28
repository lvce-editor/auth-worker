import * as oauth from 'oauth4webapi'
import { getBackendAuthUrl } from '../GetBackendAuthUrl/GetBackendAuthUrl.ts'
import { getBackendOidcTokenUrl } from '../GetBackendOidcTokenUrl/GetBackendOidcTokenUrl.ts'
import { oidcClientId } from '../OidcConfig/OidcConfig.ts'

export interface ExchangeElectronAuthorizationCodeResult {
  readonly accessToken: string
  readonly refreshToken: string
}

const getAuthorizationServer = (backendUrl: string): oauth.AuthorizationServer => {
  return {
    issuer: getBackendAuthUrl(backendUrl, '/oidc'),
    jwks_uri: getBackendAuthUrl(backendUrl, '/oidc/jwks'),
    token_endpoint: getBackendOidcTokenUrl(backendUrl),
  }
}

const getClient = (): oauth.Client => {
  return {
    client_id: oidcClientId,
  }
}

export const exchangeElectronAuthorizationCode = async (
  backendUrl: string,
  code: string,
  redirectUri: string,
  codeVerifier: string,
  requestTokenEndpoint: typeof oauth.genericTokenEndpointRequest = oauth.genericTokenEndpointRequest,
  processTokenEndpointResponse: typeof oauth.processGenericTokenEndpointResponse = oauth.processGenericTokenEndpointResponse,
): Promise<ExchangeElectronAuthorizationCodeResult> => {
  const authorizationServer = getAuthorizationServer(backendUrl)
  const client = getClient()
  const response = await requestTokenEndpoint(
    authorizationServer,
    client,
    oauth.None(),
    'authorization_code',
    new URLSearchParams({
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    }),
  )
  const tokenResponse = await processTokenEndpointResponse(authorizationServer, client, response)
  return {
    accessToken: tokenResponse.access_token,
    refreshToken: typeof tokenResponse.refresh_token === 'string' ? tokenResponse.refresh_token : '',
  }
}
