import { createUrl } from '../CreateUrl/CreateUrl.ts'
import { getEffectiveRedirectUri } from '../GetEffectiveRedirectUri/GetEffectiveRedirectUri.ts'

export interface BackendLoginRequest {
  readonly loginUrl: string
  readonly redirectUri: string
}

export const getBackendLoginRequest = async (backendUrl: string, platform = 0, uid = 0, redirectUri = ''): Promise<BackendLoginRequest> => {
  const effectiveRedirectUri = await getEffectiveRedirectUri(platform, uid, redirectUri)
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
    redirectUri: effectiveRedirectUri,
  }
}
