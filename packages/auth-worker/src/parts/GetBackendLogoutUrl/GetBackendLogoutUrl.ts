import { getBackendAuthUrl } from '../GetBackendAuthUrl/GetBackendAuthUrl.ts'

export const getBackendLogoutUrl = (backendUrl: string): string => {
  return getBackendAuthUrl(backendUrl, '/auth/logout')
}
