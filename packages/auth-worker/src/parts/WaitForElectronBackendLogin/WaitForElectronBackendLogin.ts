import { RendererWorker } from '@lvce-editor/rpc-registry'
import type { BackendAuthState } from '../BackendAuthState/BackendAuthState.ts'
import { delay } from '../Delay/Delay.ts'
import { exchangeElectronAuthorizationCode } from '../ExchangeElectronAuthorizationCode/ExchangeElectronAuthorizationCode.ts'
import { getLoggedOutBackendAuthState } from '../GetLoggedOutBackendAuthState/GetLoggedOutBackendAuthState.ts'
import { waitForBackendLogin } from '../WaitForBackendLogin/WaitForBackendLogin.ts'

const hasAuthorizationCode = (value: unknown): boolean => {
  return typeof value === 'string' && value.length > 0
}

export const waitForElectronBackendLogin = async (
  backendUrl: string,
  uid: number,
  redirectUri: string,
  timeoutMs = 30_000,
  pollIntervalMs = 1000,
): Promise<BackendAuthState> => {
  const started = Date.now()
  const deadline = started + timeoutMs
  while (Date.now() < deadline) {
    const authorizationCode = await RendererWorker.invoke('OAuthServer.getCode', String(uid))
    if (hasAuthorizationCode(authorizationCode)) {
      const elapsed = Date.now() - started
      const remainingTime = Math.max(0, timeoutMs - elapsed)
      await exchangeElectronAuthorizationCode(backendUrl, authorizationCode, redirectUri)
      return waitForBackendLogin(backendUrl, remainingTime, pollIntervalMs)
    }
    await delay(pollIntervalMs)
  }
  return getLoggedOutBackendAuthState('Timed out waiting for backend login.')
}
