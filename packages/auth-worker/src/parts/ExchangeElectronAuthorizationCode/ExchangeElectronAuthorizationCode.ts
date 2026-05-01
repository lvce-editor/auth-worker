import * as oauth from 'oauth4webapi'
import { exchangeAuthorizationCode, type ExchangeAuthorizationCodeResult } from '../ExchangeAuthorizationCode/ExchangeAuthorizationCode.ts'
import { nativeOidcClientId } from '../OidcConfig/OidcConfig.ts'

export type ExchangeElectronAuthorizationCodeResult = ExchangeAuthorizationCodeResult

export const exchangeElectronAuthorizationCode = async (
  backendUrl: string,
  code: string,
  redirectUri: string,
  codeVerifier: string,
  requestTokenEndpoint: typeof oauth.genericTokenEndpointRequest = oauth.genericTokenEndpointRequest,
  processTokenEndpointResponse: typeof oauth.processGenericTokenEndpointResponse = oauth.processGenericTokenEndpointResponse,
): Promise<ExchangeElectronAuthorizationCodeResult> => {
  return exchangeAuthorizationCode(
    backendUrl,
    nativeOidcClientId,
    code,
    redirectUri,
    codeVerifier,
    requestTokenEndpoint,
    processTokenEndpointResponse,
  )
}
