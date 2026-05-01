import { getLoggedOutBackendAuthState, logoutFromBackend } from '../BackendAuth/BackendAuth.ts'
import { clearOidcCallbackUrl, clearPendingOidcAuthState, clearStoredOidcClientId } from '../OidcAuthState/OidcAuthState.ts'
import { clearPersistentAuthValue } from '../PersistentAuthValue/PersistentAuthValue.ts'

export const logout = async (state: any): Promise<any> => {
  const loggingOutState = {
    authErrorMessage: '',
    userState: 'loggingOut',
  }
  await logoutFromBackend(state.backendUrl)
  await Promise.all([
    clearOidcCallbackUrl(),
    clearPendingOidcAuthState(),
    clearStoredOidcClientId(),
    clearPersistentAuthValue('accessToken'),
    clearPersistentAuthValue('refreshToken'),
  ])
  return {
    ...loggingOutState,
    ...getLoggedOutBackendAuthState(),
  }
}
