import type { LoginResult } from '../HandleClickLoginTypes/HandleClickLoginTypes.ts'

export const getLoggedOutBackendAuthState = (authErrorMessage = ''): LoginResult => {
  return {
    authAccessToken: '',
    authErrorMessage,
    userState: 'loggedOut',
  }
}
