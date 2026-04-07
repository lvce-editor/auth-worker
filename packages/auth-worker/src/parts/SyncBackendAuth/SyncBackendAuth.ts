import type { LoginResult } from '../HandleClickLogin/HandleClickLogin.ts'
import { getBackendRefreshUrl } from '../GetBackendRefreshUrl/GetBackendRefreshUrl.ts'
import { getLoggedOutBackendAuthState } from '../GetLoggedOutBackendAuthState/GetLoggedOutBackendAuthState.ts'
import * as MockBackendAuth from '../MockBackendAuth/MockBackendAuth.ts'
import { parseBackendAuthResponse } from '../ParseBackendAuthResponse/ParseBackendAuthResponse.ts'

export const syncBackendAuth = async (backendUrl: string): Promise<LoginResult> => {
  if (!backendUrl) {
    return getLoggedOutBackendAuthState('Backend URL is missing.')
  }
  try {
    if (MockBackendAuth.hasPendingMockRefreshResponse()) {
      const mockResponse = await MockBackendAuth.consumeNextRefreshResponse()
      return parseBackendAuthResponse(mockResponse)
    }
    const response = await fetch(getBackendRefreshUrl(backendUrl), {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
      method: 'POST',
    })
    if (response.status === 401 || response.status === 403) {
      return getLoggedOutBackendAuthState()
    }
    let payload: unknown = undefined
    try {
      payload = await response.json()
    } catch {
      payload = undefined
    }
    if (!response.ok) {
      const parsed = parseBackendAuthResponse(payload)
      return getLoggedOutBackendAuthState(parsed.authErrorMessage || 'Backend authentication failed.')
    }
    const parsed = parseBackendAuthResponse(payload)
    if (parsed.authErrorMessage) {
      return getLoggedOutBackendAuthState(parsed.authErrorMessage)
    }
    if (!parsed.authAccessToken) {
      return getLoggedOutBackendAuthState()
    }
    return parsed
  } catch (error) {
    const authErrorMessage = error instanceof Error && error.message ? error.message : 'Backend authentication failed.'
    return getLoggedOutBackendAuthState(authErrorMessage)
  }
}
