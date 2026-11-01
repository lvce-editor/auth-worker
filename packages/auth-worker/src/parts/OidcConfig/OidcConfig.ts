import { PlatformType } from '@lvce-editor/constants'

export const nativeOidcClientId = 'lvce-editor-native'

const webOidcClientId = 'lvce-editor-web'

export const oidcScope = 'openid offline_access profile email user remote'

export const getOidcClientId = (platform: number): string => {
  return platform === PlatformType.Electron ? nativeOidcClientId : webOidcClientId
}
