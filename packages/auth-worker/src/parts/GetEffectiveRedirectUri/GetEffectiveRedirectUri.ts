import { PlatformType } from '@lvce-editor/constants'
import { getCurrentHref } from '../GetCurrentHref/GetCurrentHref.ts'
import { getElectronRedirectUri } from '../GetElectronRedirectUri/GetElectronRedirectUri.ts'

const getWebRedirectUri = async (): Promise<string> => {
  const href = await getCurrentHref()
  if (!href) {
    return ''
  }
  try {
    const url = new URL(href)
    return `${url.origin}/auth/callback`
  } catch {
    return ''
  }
}

export const getEffectiveRedirectUri = async (platform: number, uid: number, redirectUri: string): Promise<string> => {
  if (redirectUri) {
    return redirectUri
  }
  if (platform === PlatformType.Electron) {
    return getElectronRedirectUri(uid)
  }
  return getWebRedirectUri()
}
