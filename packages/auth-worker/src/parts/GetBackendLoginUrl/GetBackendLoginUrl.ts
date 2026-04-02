import { getBackendAuthUrl } from '../GetBackendAuthUrl/GetBackendAuthUrl.ts'

export const getBackendLoginUrl = (backendUrl: string): string => {
  return getBackendAuthUrl(backendUrl, '/auth/login')
}
