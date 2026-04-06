import { getBackendNativeExchangeUrl } from '../GetBackendNativeExchangeUrl/GetBackendNativeExchangeUrl.ts'

const getExchangeErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = await response.json()
    if (payload && typeof payload === 'object' && typeof payload.error === 'string' && payload.error) {
      return payload.error
    }
  } catch {
    // ignore
  }
  return 'Backend authentication failed.'
}

export const exchangeElectronAuthorizationCode = async (backendUrl: string, code: string, redirectUri: string): Promise<void> => {
  const response = await fetch(getBackendNativeExchangeUrl(backendUrl), {
    body: JSON.stringify({ code, redirectUri }),
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
  if (!response.ok) {
    throw new Error(await getExchangeErrorMessage(response))
  }
}
