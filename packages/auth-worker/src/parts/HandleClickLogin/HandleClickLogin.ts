import { PlatformType } from '@lvce-editor/constants'
import { AuthProcess, OpenerWorker } from '@lvce-editor/rpc-registry'
import type { LoginOptions, LoginResult } from '../HandleClickLoginTypes/HandleClickLoginTypes.ts'
import { getUseNativeAuth, setAuthPlatform } from '../AuthPlatform/AuthPlatform.ts'
import { getLoggedOutBackendAuthState, waitForBackendLogin } from '../BackendAuth/BackendAuth.ts'
import { getAccountLoginUrl } from '../GetAccountLoginUrl/GetAccountLoginUrl.ts'
import { getAuthUseRedirect } from '../GetAuthUseRedirect/GetAuthUseRedirect.ts'
import { getBackendLoginRequest } from '../GetBackendLoginRequest/GetBackendLoginRequest.ts'
import { getCurrentHref } from '../GetCurrentHref/GetCurrentHref.ts'
import { getLoggedInState } from '../GetLoggedInState/GetLoggedInState.ts'
import { isLoginResponse } from '../IsLoginResponse/IsLoginResponse.ts'
import * as MockBackendAuth from '../MockBackendAuth/MockBackendAuth.ts'
import { clearPendingOidcAuthState, savePendingOidcAuthState } from '../OidcAuthState/OidcAuthState.ts'
import { persistLoginResult } from '../PersistLoginResult/PersistLoginResult.ts'
import { waitForElectronBackendLogin } from '../WaitForElectronBackendLogin/WaitForElectronBackendLogin.ts'

let nativeLoginCount = 0

const getMockLoginResult = async (signingInState: LoginResult, persistResult: typeof persistLoginResult): Promise<LoginResult | undefined> => {
  if (!MockBackendAuth.hasPendingMockLoginResponse()) {
    return undefined
  }
  const response = await MockBackendAuth.consumeNextLoginResponse()
  if (!isLoginResponse(response)) {
    return {
      authErrorMessage: 'Backend returned an invalid login response.',
      userState: 'loggedOut',
    }
  }
  if (typeof response.error === 'string' && response.error) {
    return {
      authErrorMessage: response.error,
      userState: 'loggedOut',
    }
  }
  return persistResult(getLoggedInState(signingInState, response))
}

const getInteractiveLoginResult = async (
  backendUrl: string,
  platform: number,
  signingInState: LoginResult,
  persistResult: typeof persistLoginResult,
  selectAccount: boolean,
): Promise<LoginResult> => {
  const nativeAuth = getUseNativeAuth() || platform === PlatformType.Electron
  const transportPlatform = nativeAuth ? PlatformType.Electron : platform
  const authUseRedirect = getAuthUseRedirect(transportPlatform)
  const uid = nativeAuth ? globalThis.crypto.randomUUID() : 0
  if (nativeAuth) {
    nativeLoginCount++
  }
  try {
    const { clientId, codeVerifier, loginUrl, redirectUri, state } = await getBackendLoginRequest(backendUrl, transportPlatform, uid)
    if (transportPlatform !== PlatformType.Electron) {
      const returnUrl = await getCurrentHref()
      await savePendingOidcAuthState({
        clientId,
        codeVerifier,
        redirectUri,
        returnUrl,
        state,
      })
    }
    await OpenerWorker.invoke('Open.openUrl', selectAccount ? getAccountLoginUrl(backendUrl, loginUrl) : loginUrl, platform, authUseRedirect)
    if (transportPlatform !== PlatformType.Electron && authUseRedirect) {
      return signingInState
    }
    const authState =
      transportPlatform === PlatformType.Electron
        ? await waitForElectronBackendLogin(backendUrl, uid, redirectUri, codeVerifier)
        : await waitForBackendLogin(backendUrl)
    if (transportPlatform !== PlatformType.Electron) {
      await clearPendingOidcAuthState()
    }
    return persistResult({
      ...authState,
      authClientId: clientId,
    })
  } finally {
    if (nativeAuth) {
      try {
        await AuthProcess.invoke('OAuthServer.dispose', String(uid))
      } finally {
        nativeLoginCount--
        if (nativeLoginCount === 0) {
          await AuthProcess.dispose()
        }
      }
    }
  }
}

export const handleClickLogin = async (
  options: LoginOptions,
  persistResult: typeof persistLoginResult = persistLoginResult,
): Promise<LoginResult> => {
  const { backendUrl, platform } = options
  setAuthPlatform(platform)
  if (!backendUrl) {
    return {
      authErrorMessage: 'Backend URL is missing.',
      userState: 'loggedOut',
    }
  }
  const signingInState: LoginResult = {
    authErrorMessage: '',
    userState: 'loggingIn',
  }
  try {
    const mockLoginResult = await getMockLoginResult(signingInState, persistResult)
    if (mockLoginResult) {
      return mockLoginResult
    }
    return await getInteractiveLoginResult(backendUrl, platform, signingInState, persistResult, options.selectAccount === true)
  } catch (error) {
    await clearPendingOidcAuthState()
    const errorMessage = error instanceof Error && error.message ? error.message : 'Backend authentication failed.'
    return {
      ...signingInState,
      ...getLoggedOutBackendAuthState(errorMessage),
    }
  }
}
