import { PlatformType } from '@lvce-editor/constants'
import { OpenerWorker } from '@lvce-editor/rpc-registry'
import type { LoginOptions, LoginResult } from '../HandleClickLoginTypes/HandleClickLoginTypes.ts'
import { getLoggedOutBackendAuthState, waitForBackendLogin } from '../BackendAuth/BackendAuth.ts'
import { getBackendLoginRequest } from '../GetBackendLoginRequest/GetBackendLoginRequest.ts'
import { getLoggedInState } from '../GetLoggedInState/GetLoggedInState.ts'
import { isLoginResponse } from '../IsLoginResponse/IsLoginResponse.ts'
import * as MockBackendAuth from '../MockBackendAuth/MockBackendAuth.ts'
import { clearPendingOidcAuthState, savePendingOidcAuthState } from '../OidcAuthState/OidcAuthState.ts'
import { persistLoginResult } from '../PersistLoginResult/PersistLoginResult.ts'
import { waitForElectronBackendLogin } from '../WaitForElectronBackendLogin/WaitForElectronBackendLogin.ts'

const getMockLoginResult = async (signingInState: LoginResult): Promise<LoginResult | undefined> => {
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
  return persistLoginResult(getLoggedInState(signingInState, response))
}

const getInteractiveLoginResult = async (
  backendUrl: string,
  platform: number,
  authUseRedirect: boolean | undefined,
  signingInState: LoginResult,
): Promise<LoginResult> => {
  const uid = 0
  const { clientId, codeVerifier, loginUrl, redirectUri, state } = await getBackendLoginRequest(backendUrl, platform, uid)
  if (platform !== PlatformType.Electron) {
    await savePendingOidcAuthState({
      clientId,
      codeVerifier,
      redirectUri,
      state,
    })
  }
  await OpenerWorker.invoke('Open.openUrl', loginUrl, platform, authUseRedirect)
  if (platform !== PlatformType.Electron && authUseRedirect) {
    return signingInState
  }
  const authState =
    platform === PlatformType.Electron
      ? await waitForElectronBackendLogin(backendUrl, uid, redirectUri, codeVerifier)
      : await waitForBackendLogin(backendUrl)
  if (platform !== PlatformType.Electron) {
    await clearPendingOidcAuthState()
  }
  return persistLoginResult({
    ...authState,
    authClientId: clientId,
  })
}

export const handleClickLogin = async (options: LoginOptions): Promise<LoginResult> => {
  const { authUseRedirect, backendUrl, platform } = options
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
    const mockLoginResult = await getMockLoginResult(signingInState)
    if (mockLoginResult) {
      return mockLoginResult
    }
    return getInteractiveLoginResult(backendUrl, platform, authUseRedirect, signingInState)
  } catch (error) {
    await clearPendingOidcAuthState()
    const errorMessage = error instanceof Error && error.message ? error.message : 'Backend authentication failed.'
    return {
      ...signingInState,
      ...getLoggedOutBackendAuthState(errorMessage),
    }
  }
}
