import { getBackendAuthUrl } from '../GetBackendAuthUrl/GetBackendAuthUrl.ts'

export const getBackendNativeExchangeUrl = (backendUrl: string): string => {
  return getBackendAuthUrl(backendUrl, '/auth/native/exchange')
}
