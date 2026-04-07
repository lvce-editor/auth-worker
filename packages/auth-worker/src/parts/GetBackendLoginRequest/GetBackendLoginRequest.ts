import { PlatformType } from '@lvce-editor/constants'
import { RendererWorker } from '@lvce-editor/rpc-registry'
import { getBackendAuthUrl } from '../GetBackendAuthUrl/GetBackendAuthUrl.ts'
import { errorHtml, successHtml } from '../OAuthCallbackHtml/OAuthCallbackHtml.ts'

export interface BackendLoginRequest {
  readonly loginUrl: string
  readonly redirectUri: string
}

export const getElectronRedirectUri = async (
  uid: number,
  invoke: (method: string, ...params: readonly string[]) => Promise<number | string>,
): Promise<string> => {
  return `http://localhost:${await invoke('OAuthServer.create', String(uid), successHtml, errorHtml)}`
}

const getCurrentHref = async (): Promise<string> => {
  try {
    return await RendererWorker.invoke('Layout.getHref')
  } catch {
    // ignore
  }
  if (!globalThis.location || typeof globalThis.location.href !== 'string' || !globalThis.location.href) {
    return ''
  }
  return globalThis.location.href
}

const getEffectiveRedirectUri = async (platform: number, uid: number, redirectUri: string): Promise<string> => {
  if (redirectUri) {
    return redirectUri
  }
  if (platform === PlatformType.Electron) {
    return getElectronRedirectUri(uid, RendererWorker.invoke)
  }
  return getCurrentHref()
}

export const getBackendLoginRequest = async (backendUrl: string, platform = 0, uid = 0, redirectUri = ''): Promise<BackendLoginRequest> => {
  const loginUrl = new URL(getBackendAuthUrl(backendUrl, '/login'))
  const effectiveRedirectUri = await getEffectiveRedirectUri(platform, uid, redirectUri)
  if (effectiveRedirectUri) {
    loginUrl.searchParams.set('redirect_uri', effectiveRedirectUri)
  }
  return {
    loginUrl: loginUrl.toString(),
    redirectUri: effectiveRedirectUri,
  }
}
