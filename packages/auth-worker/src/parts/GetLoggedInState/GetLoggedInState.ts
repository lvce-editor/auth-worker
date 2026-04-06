import type { LoginResponse } from '../LoginResponse/LoginResponse.ts'

export const getLoggedInState = (state: any, response: LoginResponse): any => {
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
