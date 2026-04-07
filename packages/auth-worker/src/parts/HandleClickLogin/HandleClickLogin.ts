import { OpenerWorker } from '@lvce-editor/rpc-registry'
import { getBackendLoginUrl, getLoggedOutBackendAuthState, waitForBackendLogin } from '../BackendAuth/BackendAuth.ts'
import { getLoggedInState } from '../GetLoggedInState/GetLoggedInState.ts'
import { isLoginResponse } from '../IsLoginResponse/IsLoginResponse.ts'
import * as MockBackendAuth from '../MockBackendAuth/MockBackendAuth.ts'

export interface LoginOptions {
  readonly backendUrl: string
  readonly platform: number
}

export interface LoginResult {
  readonly authAccessToken?: string
  readonly authErrorMessage: string
  readonly userState: 'loggedOut' | 'loggingIn' | 'loggedIn'
}

export const handleClickLogin = async (options: LoginOptions): Promise<LoginResult> => {
  const { backendUrl, platform } = options
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
      return getLoggedInState(signingInState, response)
    }
    await OpenerWorker.openUrl(getBackendLoginUrl(backendUrl), platform)
    const authState = await waitForBackendLogin(backendUrl)
    return {
      ...authState,
    }
  } catch (error) {
    const errorMessage = error instanceof Error && error.message ? error.message : 'Backend authentication failed.'
    return {
      ...signingInState,
      ...getLoggedOutBackendAuthState(errorMessage),
    }
  }
}
