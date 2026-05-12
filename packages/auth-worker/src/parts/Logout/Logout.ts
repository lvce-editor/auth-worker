import { getLoggedOutBackendAuthState, logoutFromBackend } from '../BackendAuth/BackendAuth.ts'
import { clearOidcCallbackUrl, clearPendingOidcAuthState } from '../OidcAuthState/OidcAuthState.ts'
import { clearPersistedAuthSession } from '../PersistedAuthSession/PersistedAuthSession.ts'

export const logout = async (state: any): Promise<any> => {
  const loggingOutState = {
    authErrorMessage: '',
    userState: 'loggingOut',
  }
  await logoutFromBackend(state.backendUrl)
  await Promise.all([clearOidcCallbackUrl(), clearPendingOidcAuthState(), clearPersistedAuthSession()])
  return {
    ...loggingOutState,
    ...getLoggedOutBackendAuthState(),
  }
}
