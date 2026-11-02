import { RendererWorker } from '@lvce-editor/rpc-registry'

export const processInitializers = {
  initializeAuthProcess: (): Promise<void> => RendererWorker.initializeAuthProcess(),
  initializeMainProcess: (): Promise<void> => RendererWorker.initializeMainProcess(),
}
