import { PlatformType } from '@lvce-editor/constants'
import { setAuthPlatform, setUseNativeAuth } from '../AuthPlatform/AuthPlatform.ts'
import { processInitializers } from '../ProcessInitializers/ProcessInitializers.ts'

export interface ConfigureOptions {
  readonly platform: number
  readonly useNativeAuth?: boolean
}

export interface InitializerFunctions {
  readonly initializeAuthProcess: () => Promise<void>
  readonly initializeMainProcess: () => Promise<void>
}

export const getProcessInitializers = (
  options: ConfigureOptions,
  initializers: Readonly<InitializerFunctions> = processInitializers,
): ReadonlyArray<() => Promise<void>> => {
  if (options.platform === PlatformType.Electron) {
    return [initializers.initializeAuthProcess, initializers.initializeMainProcess]
  }
  if (options.useNativeAuth) {
    return [initializers.initializeAuthProcess]
  }
  return []
}

export const configure = async (options: ConfigureOptions): Promise<void> => {
  setAuthPlatform(options.platform)
  setUseNativeAuth(options.useNativeAuth === true)
  await Promise.all(getProcessInitializers(options).map((initialize) => initialize()))
}
