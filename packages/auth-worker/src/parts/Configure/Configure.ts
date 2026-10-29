import { PlatformType } from '@lvce-editor/constants'
import { setAuthPlatform, setUseNativeAuth } from '../AuthPlatform/AuthPlatform.ts'
import { initializeAuthProcess } from '../InitializeAuthProcess/InitializeAuthProcess.ts'
import { initializeMainProcess } from '../InitializeMainProcess/InitializeMainProcess.ts'

export interface ConfigureOptions {
  readonly platform: number
  readonly useNativeAuth?: boolean
}

export const configure = async (options: ConfigureOptions): Promise<void> => {
  setAuthPlatform(options.platform)
  setUseNativeAuth(options.useNativeAuth === true)
  if (options.platform === PlatformType.Electron) {
    await Promise.all([initializeAuthProcess(), initializeMainProcess()])
  } else if (options.useNativeAuth) {
    await initializeAuthProcess()
  }
}
