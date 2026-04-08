import { getBackendAuthUrl } from '../GetBackendAuthUrl/GetBackendAuthUrl.ts'

export const getBackendOidcTokenUrl = (backendUrl: string): string => {
  return getBackendAuthUrl(backendUrl, '/oidc/token')
}
