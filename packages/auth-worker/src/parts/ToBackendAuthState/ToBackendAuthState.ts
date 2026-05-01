import type { BackendAuthResponse } from '../BackendAuthResponse/BackendAuthResponse.ts'
import type { LoginResult } from '../HandleClickLoginTypes/HandleClickLoginTypes.ts'
import { getNumber } from '../GetNumber/GetNumber.ts'
import { getString } from '../GetString/GetString.ts'

const getUserName = (value: BackendAuthResponse): string => {
  if (typeof value.userName === 'string') {
    return value.userName
  }
  return getString(value.user?.displayName)
}

export const toBackendAuthState = (value: BackendAuthResponse): LoginResult => {
  return {
    authAccessToken: getString(value.accessToken),
    authErrorMessage: getString(value.error),
    authRefreshToken: getString(value.refreshToken),
    userName: getUserName(value),
    userState: value.accessToken ? 'loggedIn' : 'loggedOut',
    userSubscriptionPlan: getString(value.subscriptionPlan),
    userSubscriptionStatus: getString(value.subscriptionStatus),
    userUsedTokens: getNumber(value.usedTokens),
  } as any
}
