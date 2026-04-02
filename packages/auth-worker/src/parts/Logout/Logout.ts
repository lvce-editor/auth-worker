import { getLoggedOutBackendAuthState, logoutFromBackend } from '../BackendAuth/BackendAuth.ts'

export const logout = async (state: any): Promise<any> => {
  const loggingOutState = {
    authErrorMessage: '',
    userState: 'loggingOut',
  }
  await logoutFromBackend(state.backendUrl)
  return {
    ...loggingOutState,
    ...getLoggedOutBackendAuthState(),
  }
}
