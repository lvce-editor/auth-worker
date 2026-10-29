import { RendererWorker } from '@lvce-editor/rpc-registry'
import { initializeRendererWorker } from '../InitializeRendererWorker/InitializeRendererWorker.ts'

export const listen = async (): Promise<void> => {
  await Promise.all([initializeRendererWorker(), RendererWorker.initializeOpenerWorker()])
}
