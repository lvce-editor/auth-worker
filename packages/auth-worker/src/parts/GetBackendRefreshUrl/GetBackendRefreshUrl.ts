import { getBackendAuthUrl } from '../GetBackendAuthUrl/GetBackendAuthUrl.ts'

export const getBackendRefreshUrl = (backendUrl: string): string => {
  return getBackendAuthUrl(backendUrl, '/auth/refresh')
}
