import type { BackendAuthState } from '../BackendAuthState/BackendAuthState.ts'
import { delay } from '../Delay/Delay.ts'
import { getLoggedOutBackendAuthState } from '../GetLoggedOutBackendAuthState/GetLoggedOutBackendAuthState.ts'
import { syncBackendAuth } from '../SyncBackendAuth/SyncBackendAuth.ts'

export const waitForBackendLogin = async (backendUrl: string, timeoutMs = 30_000, pollIntervalMs = 1000): Promise<BackendAuthState> => {
  const deadline = Date.now() + timeoutMs
  let lastErrorMessage = ''
  while (Date.now() < deadline) {
    const authState = await syncBackendAuth(backendUrl)
    if (authState.userState === 'loggedIn') {
      return authState
    }
    if (authState.authErrorMessage) {
      lastErrorMessage = authState.authErrorMessage
    }
    await delay(pollIntervalMs)
  }
  return getLoggedOutBackendAuthState(lastErrorMessage)
}
