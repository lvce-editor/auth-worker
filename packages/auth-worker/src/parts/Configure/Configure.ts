import { PlatformType } from '@lvce-editor/constants'
import { setAuthPlatform, setUseNativeAuth } from '../AuthPlatform/AuthPlatform.ts'
import { RendererWorker } from '@lvce-editor/rpc-registry'

export interface ConfigureOptions {
  readonly platform: number
  readonly useNativeAuth?: boolean
}

export const configure = async (options: ConfigureOptions): Promise<void> => {
  setAuthPlatform(options.platform)
  setUseNativeAuth(options.useNativeAuth === true)
  if (options.platform === PlatformType.Electron) {
    await Promise.all([RendererWorker.initializeAuthProcess(), RendererWorker.initializeMainProcess()])
  } else if (options.useNativeAuth) {
    await RendererWorker.initializeAuthProcess()
  }
}
