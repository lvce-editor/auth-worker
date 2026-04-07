import type { BackendAuthResponse } from '../BackendAuthResponse/BackendAuthResponse.ts'
import type { LoginResult } from '../HandleClickLogin/HandleClickLogin.ts'
import { getNumber } from '../GetNumber/GetNumber.ts'
import { getString } from '../GetString/GetString.ts'

export const toBackendAuthState = (value: BackendAuthResponse): LoginResult => {
  return {
    authAccessToken: getString(value.accessToken),
    authErrorMessage: getString(value.error),
    userName: getString(value.userName),
    userState: value.accessToken ? 'loggedIn' : 'loggedOut',
    userSubscriptionPlan: getString(value.subscriptionPlan),
    userUsedTokens: getNumber(value.usedTokens),
  } as any
}
