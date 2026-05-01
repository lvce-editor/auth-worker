import * as oauth from 'oauth4webapi'
import { getBackendAuthUrl } from '../GetBackendAuthUrl/GetBackendAuthUrl.ts'
import { getBackendOidcTokenUrl } from '../GetBackendOidcTokenUrl/GetBackendOidcTokenUrl.ts'

export interface RefreshOidcTokensResult {
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

const getClient = (clientId: string): oauth.Client => {
  return {
    client_id: clientId,
  }
}

export const refreshOidcTokens = async (
  backendUrl: string,
  clientId: string,
  refreshToken: string,
  requestTokenEndpoint: typeof oauth.genericTokenEndpointRequest = oauth.genericTokenEndpointRequest,
  processTokenEndpointResponse: typeof oauth.processGenericTokenEndpointResponse = oauth.processGenericTokenEndpointResponse,
): Promise<RefreshOidcTokensResult> => {
  const authorizationServer = getAuthorizationServer(backendUrl)
  const client = getClient(clientId)
  const response = await requestTokenEndpoint(
    authorizationServer,
    client,
    oauth.None(),
    'refresh_token',
    new URLSearchParams({
      refresh_token: refreshToken,
    }),
  )
  const tokenResponse = await processTokenEndpointResponse(authorizationServer, client, response)
  return {
    accessToken: tokenResponse.access_token,
    refreshToken: typeof tokenResponse.refresh_token === 'string' ? tokenResponse.refresh_token : refreshToken,
  }
}
