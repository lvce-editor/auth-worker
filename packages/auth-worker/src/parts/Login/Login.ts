import { OpenerWorker, RendererWorker } from '@lvce-editor/rpc-registry'
import type { ChatState } from '../ChatState/ChatState.ts'
import { getBackendLoginUrl, getLoggedOutBackendAuthState, waitForBackendLogin } from '../BackendAuth/BackendAuth.ts'
import * as MockBackendAuth from '../MockBackendAuth/MockBackendAuth.ts'
import { set } from '../StatusBarStates/StatusBarStates.ts'

interface LoginResponse {
  readonly accessToken?: string
  readonly error?: string
  readonly subscriptionPlan?: string
  readonly usedTokens?: number
  readonly userName?: string
}

const isLoginResponse = (value: unknown): value is LoginResponse => {
  if (!value || typeof value !== 'object') {
    return false
  }
  return true
}

const getLoggedInState = (state: ChatState, response: LoginResponse): ChatState => {
  const accessToken = typeof response.accessToken === 'string' ? response.accessToken : ''
  return {
    ...state,
    authAccessToken: accessToken,
    authErrorMessage: '',
    userName: typeof response.userName === 'string' ? response.userName : state.userName,
    userState: accessToken ? 'loggedIn' : 'loggedOut',
    userSubscriptionPlan: typeof response.subscriptionPlan === 'string' ? response.subscriptionPlan : state.userSubscriptionPlan,
    userUsedTokens: typeof response.usedTokens === 'number' ? response.usedTokens : state.userUsedTokens,
  }
}

export const handleClickLogin = async (state: ChatState): Promise<ChatState> => {
  if (!state.backendUrl) {
    return {
      ...state,
      authErrorMessage: 'Backend URL is missing.',
      userState: 'loggedOut',
    }
  }
  const signingInState: ChatState = {
    ...state,
    authErrorMessage: '',
    userState: 'loggingIn',
  }
  if (state.uid) {
    set(state.uid, state, signingInState)
    await RendererWorker.invoke('Chat.rerender')
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
