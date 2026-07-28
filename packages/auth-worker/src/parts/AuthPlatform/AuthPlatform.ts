import { PlatformType } from '@lvce-editor/constants'

const state = {
  platform: PlatformType.Web,
}

export const getAuthPlatform = (): number => {
  return state.platform
}

export const setAuthPlatform = (value: number): void => {
  state.platform = value
}
