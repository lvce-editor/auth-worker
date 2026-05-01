import type { LoginResult } from '../HandleClickLoginTypes/HandleClickLoginTypes.ts'
import { saveOidcClientId } from '../OidcAuthState/OidcAuthState.ts'
import { setPersistentAuthValue } from '../PersistentAuthValue/PersistentAuthValue.ts'

export const persistLoginResult = async (loginResult: LoginResult): Promise<LoginResult> => {
  if (loginResult.userState !== 'loggedIn') {
    return loginResult
  }
  await Promise.all([
    setPersistentAuthValue('accessToken', loginResult.authAccessToken ?? ''),
    setPersistentAuthValue('refreshToken', loginResult.authRefreshToken ?? ''),
    loginResult.authClientId ? saveOidcClientId(loginResult.authClientId) : Promise.resolve(),
  ])
  return loginResult
}
