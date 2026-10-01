import { setAuthBackendUrl } from '../AuthBackendUrl/AuthBackendUrl.ts'
import { setAuthPlatform } from '../AuthPlatform/AuthPlatform.ts'

export interface ConfigureOptions {
  readonly backendUrl: string
  readonly platform: number
}

export const configure = (options: ConfigureOptions): void => {
  setAuthBackendUrl(options.backendUrl)
  setAuthPlatform(options.platform)
}
