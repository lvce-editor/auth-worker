import { PlatformType } from '@lvce-editor/constants'
import { RendererWorker } from '@lvce-editor/rpc-registry'
import { setAuthPlatform, setUseNativeAuth } from '../AuthPlatform/AuthPlatform.ts'

export interface ConfigureOptions {
  readonly platform: number
  readonly useNativeAuth?: boolean
}

interface ProcessInitializers {
  readonly initializeAuthProcess: () => Promise<void>
  readonly initializeMainProcess: () => Promise<void>
}

export const configure = async (options: ConfigureOptions, rendererWorker?: Readonly<ProcessInitializers>): Promise<void> => {
  const processInitializers =
    rendererWorker ??
    ({
      initializeAuthProcess: RendererWorker.initializeAuthProcess,
      initializeMainProcess: RendererWorker.initializeMainProcess,
    } satisfies ProcessInitializers)
  setAuthPlatform(options.platform)
  setUseNativeAuth(options.useNativeAuth === true)
  if (options.platform === PlatformType.Electron) {
    await Promise.all([processInitializers.initializeAuthProcess(), processInitializers.initializeMainProcess()])
  } else if (options.useNativeAuth) {
    await processInitializers.initializeAuthProcess()
  }
}
