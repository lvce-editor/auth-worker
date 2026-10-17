import { PlatformType } from '@lvce-editor/constants'
import { setAuthBackendUrl } from '../AuthBackendUrl/AuthBackendUrl.ts'
import { setAuthPlatform } from '../AuthPlatform/AuthPlatform.ts'
import { initializeAuthProcess } from '../InitializeAuthProcess/InitializeAuthProcess.ts'
import { initializeMainProcess } from '../InitializeMainProcess/InitializeMainProcess.ts'

export interface ConfigureOptions {
  readonly backendUrl: string
  readonly platform: number
}

export const configure = async (options: ConfigureOptions): Promise<void> => {
  setAuthBackendUrl(options.backendUrl)
  setAuthPlatform(options.platform)
  if (options.platform === PlatformType.Electron) {
    await Promise.all([initializeAuthProcess(), initializeMainProcess()])
  }
}
