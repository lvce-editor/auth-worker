import type { LoginResult } from '../HandleClickLoginTypes/HandleClickLoginTypes.ts'
import { setPersistentAuthValue } from '../PersistentAuthValue/PersistentAuthValue.ts'

export const persistLoginResult = async (loginResult: LoginResult): Promise<LoginResult> => {
  if (loginResult.userState !== 'loggedIn') {
    return loginResult
  }
  await setPersistentAuthValue('accessToken', loginResult.authAccessToken ?? '')
  await setPersistentAuthValue('refreshToken', loginResult.authRefreshToken ?? '')
  return loginResult
}
