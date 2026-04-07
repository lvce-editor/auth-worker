import type { LoginResult } from '../HandleClickLogin/HandleClickLogin.ts'

export const getLoggedOutBackendAuthState = (authErrorMessage = ''): LoginResult => {
  return {
    authAccessToken: '',
    authErrorMessage,
    userState: 'loggedOut',
  }
}
