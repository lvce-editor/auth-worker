import type { LoginResult } from '../HandleClickLogin/HandleClickLogin.ts'
import { processPendingOidcCallback } from '../ProcessPendingOidcCallback/ProcessPendingOidcCallback.ts'
import { syncBackendAuth } from '../SyncBackendAuth/SyncBackendAuth.ts'

export interface InitializeOptions {
  readonly backendUrl: string
  readonly platform: number
}

export const initialize = async (options: InitializeOptions): Promise<LoginResult> => {
  const { backendUrl, platform } = options
  void platform
  await processPendingOidcCallback()
  return syncBackendAuth(backendUrl)
}
