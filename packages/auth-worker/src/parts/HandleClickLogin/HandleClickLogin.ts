import { PlatformType } from '@lvce-editor/constants'
import { OpenerWorker } from '@lvce-editor/rpc-registry'
import type { LoginOptions, LoginResult } from '../HandleClickLoginTypes/HandleClickLoginTypes.ts'
import { getLoggedOutBackendAuthState, waitForBackendLogin } from '../BackendAuth/BackendAuth.ts'
import { getBackendLoginRequest } from '../GetBackendLoginRequest/GetBackendLoginRequest.ts'
import { getLoggedInState } from '../GetLoggedInState/GetLoggedInState.ts'
import { isLoginResponse } from '../IsLoginResponse/IsLoginResponse.ts'
import * as MockBackendAuth from '../MockBackendAuth/MockBackendAuth.ts'
import { persistLoginResult } from '../PersistLoginResult/PersistLoginResult.ts'
import { waitForElectronBackendLogin } from '../WaitForElectronBackendLogin/WaitForElectronBackendLogin.ts'

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
    if (MockBackendAuth.hasPendingMockLoginResponse()) {
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
    const uid = 0
    const { codeVerifier, loginUrl, redirectUri } = await getBackendLoginRequest(backendUrl, platform, uid)
    await OpenerWorker.invoke('Open.openUrl', loginUrl, platform, authUseRedirect)
    const authState =
      platform === PlatformType.Electron
        ? await waitForElectronBackendLogin(backendUrl, uid, redirectUri, codeVerifier)
        : await waitForBackendLogin(backendUrl)
    return persistLoginResult(authState)
  } catch (error) {
    const errorMessage = error instanceof Error && error.message ? error.message : 'Backend authentication failed.'
    return {
      ...signingInState,
      ...getLoggedOutBackendAuthState(errorMessage),
    }
  }
}
