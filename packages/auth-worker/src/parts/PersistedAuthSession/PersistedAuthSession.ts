import type { LoginResult } from '../HandleClickLoginTypes/HandleClickLoginTypes.ts'
import { clearStoredOidcClientId, getStoredOidcClientId, saveOidcClientId } from '../OidcAuthState/OidcAuthState.ts'
import { clearPersistentAuthValue, getPersistentAuthValue, setPersistentAuthValue } from '../PersistentAuthValue/PersistentAuthValue.ts'

const accessTokenKey = 'accessToken'
const refreshTokenKey = 'refreshToken'
const userNameKey = 'userName'
const userSubscriptionPlanKey = 'userSubscriptionPlan'
const userSubscriptionStatusKey = 'userSubscriptionStatus'
const userUsedTokensKey = 'userUsedTokens'

const toOptionalString = (value: string): string | undefined => {
  return value || undefined
}

const toOptionalNumber = (value: string): number | undefined => {
  if (!value) {
    return undefined
  }
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : undefined
}

export const clearPersistedAuthSession = async (): Promise<void> => {
  await Promise.all([
    clearPersistentAuthValue(accessTokenKey),
    clearPersistentAuthValue(refreshTokenKey),
    clearStoredOidcClientId(),
    clearPersistentAuthValue(userNameKey),
    clearPersistentAuthValue(userSubscriptionPlanKey),
    clearPersistentAuthValue(userSubscriptionStatusKey),
    clearPersistentAuthValue(userUsedTokensKey),
  ])
}

export const getPersistedAuthSession = async (): Promise<LoginResult | undefined> => {
  const [accessToken, refreshToken, authClientId, userName, userSubscriptionPlan, userSubscriptionStatus, userUsedTokens] = await Promise.all([
    getPersistentAuthValue(accessTokenKey),
    getPersistentAuthValue(refreshTokenKey),
    getStoredOidcClientId(),
    getPersistentAuthValue(userNameKey),
    getPersistentAuthValue(userSubscriptionPlanKey),
    getPersistentAuthValue(userSubscriptionStatusKey),
    getPersistentAuthValue(userUsedTokensKey),
  ])
  if (!accessToken && !refreshToken) {
    return undefined
  }
  const optionalAuthClientId = toOptionalString(authClientId)
  const optionalRefreshToken = toOptionalString(refreshToken)
  const optionalUserName = toOptionalString(userName)
  const optionalSubscriptionPlan = toOptionalString(userSubscriptionPlan)
  const optionalSubscriptionStatus = toOptionalString(userSubscriptionStatus)
  const optionalUsedTokens = toOptionalNumber(userUsedTokens)
  return {
    authAccessToken: accessToken,
    authErrorMessage: '',
    userState: 'loggedIn',
    ...(optionalAuthClientId ? { authClientId } : {}),
    ...(optionalRefreshToken ? { authRefreshToken: refreshToken } : {}),
    ...(optionalUserName ? { userName } : {}),
    ...(optionalSubscriptionPlan ? { userSubscriptionPlan } : {}),
    ...(optionalSubscriptionStatus ? { userSubscriptionStatus } : {}),
    ...(typeof optionalUsedTokens === 'number' ? { userUsedTokens: optionalUsedTokens } : {}),
  }
}

export const persistAuthSession = async (loginResult: LoginResult): Promise<void> => {
  await Promise.all([
    setPersistentAuthValue(accessTokenKey, loginResult.authAccessToken ?? ''),
    setPersistentAuthValue(refreshTokenKey, loginResult.authRefreshToken ?? ''),
    loginResult.authClientId ? saveOidcClientId(loginResult.authClientId) : clearStoredOidcClientId(),
    setPersistentAuthValue(userNameKey, loginResult.userName ?? ''),
    setPersistentAuthValue(userSubscriptionPlanKey, loginResult.userSubscriptionPlan ?? ''),
    setPersistentAuthValue(userSubscriptionStatusKey, loginResult.userSubscriptionStatus ?? ''),
    setPersistentAuthValue(userUsedTokensKey, typeof loginResult.userUsedTokens === 'number' ? String(loginResult.userUsedTokens) : ''),
  ])
}
