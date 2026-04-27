import { getBackendOidcTokenUrl } from '../GetBackendOidcTokenUrl/GetBackendOidcTokenUrl.ts'
import { oidcClientId } from '../OidcConfig/OidcConfig.ts'

interface OidcTokenResponse {
  readonly error?: string
  readonly error_description?: string
}

interface ExchangeElectronAuthorizationCodeRequest {
  readonly client_id: string
  readonly code: string
  readonly code_verifier: string
  readonly grant_type: 'authorization_code'
  readonly redirect_uri: string
}

const getResponsePayload = async (response: Response): Promise<OidcTokenResponse | undefined> => {
  try {
    return (await response.json()) as OidcTokenResponse
  } catch {
    return undefined
  }
}

const getExchangeErrorMessage = (payload: OidcTokenResponse | undefined): string => {
  if (payload?.error_description) {
    return payload.error_description
  }
  if (payload?.error) {
    return payload.error
  }
  return 'Backend authentication failed.'
}

export const exchangeElectronAuthorizationCode = async (
  backendUrl: string,
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<void> => {
  const request: ExchangeElectronAuthorizationCodeRequest = {
    client_id: oidcClientId,
    code,
    code_verifier: codeVerifier,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  }
  const response = await fetch(getBackendOidcTokenUrl(backendUrl), {
    body: JSON.stringify(request),
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
  const payload = await getResponsePayload(response)
  if (!response.ok) {
    throw new Error(getExchangeErrorMessage(payload))
  }
}
