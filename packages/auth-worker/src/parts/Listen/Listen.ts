import { initializeOpenerWorker } from '../InitializeOpenerWorker/InitializeOpenerWorker.ts'
import { initializeRendererWorker } from '../InitializeRendererWorker/InitializeRendererWorker.ts'
import { processPendingOidcCallback } from '../ProcessPendingOidcCallback/ProcessPendingOidcCallback.ts'

export const listen = async (): Promise<void> => {
  await Promise.all([initializeRendererWorker(), initializeOpenerWorker()])
  void processPendingOidcCallback()
}
