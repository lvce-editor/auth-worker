import { PlatformType } from '@lvce-editor/constants'
import { RendererWorker } from '@lvce-editor/rpc-registry'
import { getCurrentHref } from '../GetCurrentHref/GetCurrentHref.ts'
import { getElectronRedirectUri } from '../GetElectronRedirectUri/GetElectronRedirectUri.ts'

export const getEffectiveRedirectUri = async (platform: number, uid: number, redirectUri: string): Promise<string> => {
  if (redirectUri) {
    return redirectUri
  }
  if (platform === PlatformType.Electron) {
    return getElectronRedirectUri(uid, RendererWorker.invoke)
  }
  return getCurrentHref()
}