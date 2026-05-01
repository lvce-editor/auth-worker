import type { LoginResponse } from '../LoginResponse/LoginResponse.ts'

export const getLoggedInState = (state: any, response: LoginResponse): any => {
  const accessToken = typeof response.accessToken === 'string' ? response.accessToken : ''
  const refreshToken = typeof response.refreshToken === 'string' ? response.refreshToken : ''
  return {
    ...state,
    authAccessToken: accessToken,
    authErrorMessage: '',
    authRefreshToken: refreshToken,
    userName: typeof response.userName === 'string' ? response.userName : state.userName,
    userState: accessToken ? 'loggedIn' : 'loggedOut',
    userSubscriptionPlan: typeof response.subscriptionPlan === 'string' ? response.subscriptionPlan : state.userSubscriptionPlan,
    userSubscriptionStatus: typeof response.subscriptionStatus === 'string' ? response.subscriptionStatus : state.userSubscriptionStatus,
    userUsedTokens: typeof response.usedTokens === 'number' ? response.usedTokens : state.userUsedTokens,
  }
}
