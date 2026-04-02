import type { BackendAuthState } from '../BackendAuthState/BackendAuthState.ts'

export const getLoggedOutBackendAuthState = (authErrorMessage = ''): BackendAuthState => {
  return {
    authAccessToken: '',
    authErrorMessage,
    userName: '',
    userState: 'loggedOut',
    userSubscriptionPlan: '',
    userUsedTokens: 0,
  }
}
