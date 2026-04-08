import { getBackendAuthUrl } from '../GetBackendAuthUrl/GetBackendAuthUrl.ts'
import { getEffectiveRedirectUri } from '../GetEffectiveRedirectUri/GetEffectiveRedirectUri.ts'

export interface BackendLoginRequest {
  readonly loginUrl: string
  readonly redirectUri: string
}

export const getBackendLoginRequest = async (backendUrl: string, platform = 0, uid = 0, redirectUri = ''): Promise<BackendLoginRequest> => {
  const loginUrl = new URL(getBackendAuthUrl(backendUrl, '/login'))
  const effectiveRedirectUri = await getEffectiveRedirectUri(platform, uid, redirectUri)
  if (effectiveRedirectUri) {
    loginUrl.searchParams.set('redirect_uri', effectiveRedirectUri)
  }
  return {
    loginUrl: loginUrl.toString(),
    redirectUri: effectiveRedirectUri,
  }
}
