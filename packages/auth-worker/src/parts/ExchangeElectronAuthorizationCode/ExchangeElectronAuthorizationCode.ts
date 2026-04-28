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
  nonce: string,
  requestAuthorizationCodeGrant: typeof oauth.authorizationCodeGrantRequest = oauth.authorizationCodeGrantRequest,
  processAuthorizationCodeGrantResponse: typeof oauth.processAuthorizationCodeResponse = oauth.processAuthorizationCodeResponse,
): Promise<ExchangeElectronAuthorizationCodeResult> => {
  const authorizationServer = getAuthorizationServer(backendUrl)
  const client = getClient()
  const response = await requestAuthorizationCodeGrant(
    authorizationServer,
    client,
    oauth.None(),
    new URLSearchParams({ code }),
    redirectUri,
    codeVerifier,
  )
  const tokenResponse = await processAuthorizationCodeGrantResponse(authorizationServer, client, response, {
    expectedNonce: nonce,
  })
  return {
    accessToken: tokenResponse.access_token,
    refreshToken: typeof tokenResponse.refresh_token === 'string' ? tokenResponse.refresh_token : '',
  }
}
