export interface LoginOptions {
  readonly authUseRedirect?: boolean
  readonly backendUrl: string
  readonly platform: number
}

export interface LoginResult {
  readonly authAccessToken?: string
  readonly authCode?: string
  readonly authCodeVerifier?: string
  readonly authErrorMessage: string
  readonly authRefreshToken?: string
  readonly userState: 'loggedOut' | 'loggingIn' | 'loggedIn'
}
