import { getBackendOidcTokenUrl } from '../GetBackendOidcTokenUrl/GetBackendOidcTokenUrl.ts'
import { oidcClientId } from '../OidcConfig/OidcConfig.ts'

interface OidcTokenResponse {
  readonly error?: string
  readonly error_description?: string
  readonly refresh_token?: string
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
): Promise<string> => {
  const response = await fetch(getBackendOidcTokenUrl(backendUrl), {
    body: new URLSearchParams({
      client_id: oidcClientId,
      code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  })
  const payload = await getResponsePayload(response)
  if (!response.ok) {
    throw new Error(getExchangeErrorMessage(payload))
  }
  if (!payload?.refresh_token) {
    throw new Error('Backend did not return a refresh token.')
  }
  return payload.refresh_token
}
