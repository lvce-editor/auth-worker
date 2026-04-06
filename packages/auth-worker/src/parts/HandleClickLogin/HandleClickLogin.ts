import { OpenerWorker } from '@lvce-editor/rpc-registry'
import { getBackendLoginUrl, getLoggedOutBackendAuthState, waitForBackendLogin } from '../BackendAuth/BackendAuth.ts'
import { getLoggedInState } from '../GetLoggedInState/GetLoggedInState.ts'
import { isLoginResponse } from '../IsLoginResponse/IsLoginResponse.ts'
import * as MockBackendAuth from '../MockBackendAuth/MockBackendAuth.ts'

export const handleClickLogin = async (state: any): Promise<any> => {
  if (!state.backendUrl) {
    return {
      ...state,
      authErrorMessage: 'Backend URL is missing.',
      userState: 'loggedOut',
    }
  }
  const signingInState: any = {
    ...state,
    authErrorMessage: '',
    userState: 'loggingIn',
  }
  try {
    if (MockBackendAuth.hasPendingMockLoginResponse()) {
      const response = await MockBackendAuth.consumeNextLoginResponse()
      if (!isLoginResponse(response)) {
        return {
          ...signingInState,
          authErrorMessage: 'Backend returned an invalid login response.',
          userState: 'loggedOut',
        }
      }
      if (typeof response.error === 'string' && response.error) {
        return {
          ...signingInState,
          authErrorMessage: response.error,
          userState: 'loggedOut',
        }
      }
      return getLoggedInState(signingInState, response)
    }
    await OpenerWorker.openUrl(getBackendLoginUrl(state.backendUrl), state.platform)
    const authState = await waitForBackendLogin(state.backendUrl)
    return {
      ...signingInState,
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
