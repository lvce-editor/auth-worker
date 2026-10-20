import { PlatformType } from '@lvce-editor/constants'

const state = {
  platform: PlatformType.Web,
  useNativeAuth: false,
}

export const getAuthPlatform = (): number => {
  return state.platform
}

export const setAuthPlatform = (value: number): void => {
  state.platform = value
}

// Native shells can use loopback OAuth without Electron's process or secret storage.
export const setUseNativeAuth = (value: boolean): void => {
  state.useNativeAuth = value
}

export const getUseNativeAuth = (): boolean => state.useNativeAuth
