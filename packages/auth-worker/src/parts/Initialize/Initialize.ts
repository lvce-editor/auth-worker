import { PlatformType } from '@lvce-editor/constants'
import type { LoginResult } from '../HandleClickLoginTypes/HandleClickLoginTypes.ts'
import { setAuthBackendUrl } from '../AuthBackendUrl/AuthBackendUrl.ts'
import { setAuthPlatform } from '../AuthPlatform/AuthPlatform.ts'
import { completeBrowserOidcLogin } from '../CompleteBrowserOidcLogin/CompleteBrowserOidcLogin.ts'
import { getLoggedOutBackendAuthState } from '../GetLoggedOutBackendAuthState/GetLoggedOutBackendAuthState.ts'
import { getPersistedAuthSession } from '../PersistedAuthSession/PersistedAuthSession.ts'
import { persistLoginResult } from '../PersistLoginResult/PersistLoginResult.ts'
import { restoreOidcAuth } from '../RestoreOidcAuth/RestoreOidcAuth.ts'

export interface InitializeOptions {
  readonly backendUrl?: string
  readonly href?: string
  readonly platform?: number
}

const getBackendUrl = (options: InitializeOptions | number): string => {
  if (typeof options === 'number') {
    return ''
  }
  return options.backendUrl || ''
}

const getPlatform = (options: InitializeOptions | number): number => {
  return typeof options === 'number' ? options : (options.platform ?? PlatformType.Web)
}

export const initialize = async (options: InitializeOptions | number): Promise<LoginResult> => {
  const backendUrl = getBackendUrl(options)
  setAuthBackendUrl(backendUrl)
  setAuthPlatform(getPlatform(options))
  try {
    if (backendUrl) {
      const completedBrowserLogin = await completeBrowserOidcLogin(backendUrl)
      if (completedBrowserLogin) {
        return persistLoginResult(completedBrowserLogin)
      }
      const restoredOidcAuth = await restoreOidcAuth(backendUrl)
      if (restoredOidcAuth) {
        return persistLoginResult(restoredOidcAuth)
      }
    }
    const persistedAuthSession = await getPersistedAuthSession()
    if (persistedAuthSession) {
      return persistedAuthSession
    }
    return getLoggedOutBackendAuthState()
  } catch (error) {
    const authErrorMessage = error instanceof Error && error.message ? error.message : 'Backend authentication failed.'
    return getLoggedOutBackendAuthState(authErrorMessage)
  }
}
