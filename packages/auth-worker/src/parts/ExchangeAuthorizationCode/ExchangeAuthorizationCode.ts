import * as oauth from 'oauth4webapi'
import { getBackendAuthUrl } from '../GetBackendAuthUrl/GetBackendAuthUrl.ts'
import { getBackendOidcTokenUrl } from '../GetBackendOidcTokenUrl/GetBackendOidcTokenUrl.ts'

export interface ExchangeAuthorizationCodeResult {
  readonly accessToken: string
  readonly expiresIn: number | undefined
  readonly refreshToken: string
}

const getAuthorizationServer = (backendUrl: string): oauth.AuthorizationServer => {
  return {
    issuer: getBackendAuthUrl(backendUrl, '/oidc'),
    jwks_uri: getBackendAuthUrl(backendUrl, '/oidc/jwks'),
    token_endpoint: getBackendOidcTokenUrl(backendUrl),
  }
}

const getClient = (clientId: string): oauth.Client => {
  return {
    client_id: clientId,
  }
}

export const exchangeAuthorizationCode = async (
  backendUrl: string,
  clientId: string,
  code: string,
  redirectUri: string,
  codeVerifier: string,
  requestTokenEndpoint: typeof oauth.genericTokenEndpointRequest = oauth.genericTokenEndpointRequest,
  processTokenEndpointResponse: typeof oauth.processGenericTokenEndpointResponse = oauth.processGenericTokenEndpointResponse,
): Promise<ExchangeAuthorizationCodeResult> => {
  const authorizationServer = getAuthorizationServer(backendUrl)
  const client = getClient(clientId)
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
    expiresIn: typeof tokenResponse.expires_in === 'number' ? tokenResponse.expires_in : undefined,
    refreshToken: typeof tokenResponse.refresh_token === 'string' ? tokenResponse.refresh_token : '',
  }
}
