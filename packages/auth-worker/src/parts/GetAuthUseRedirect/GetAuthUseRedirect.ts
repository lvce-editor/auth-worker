import { PlatformType } from '@lvce-editor/constants'

export const getAuthUseRedirect = (platform: number): boolean => {
  return platform !== PlatformType.Electron
}
