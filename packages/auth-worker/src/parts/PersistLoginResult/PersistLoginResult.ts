import type { LoginResult } from '../HandleClickLoginTypes/HandleClickLoginTypes.ts'
import { clearPersistedAuthSession, persistAuthSession } from '../PersistedAuthSession/PersistedAuthSession.ts'

export const persistLoginResult = async (loginResult: LoginResult): Promise<LoginResult> => {
  if (loginResult.userState !== 'loggedIn') {
    await clearPersistedAuthSession()
    return loginResult
  }
  await persistAuthSession(loginResult)
  return loginResult
}
