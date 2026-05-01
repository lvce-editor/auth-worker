export interface LoginOptions {
  readonly authUseRedirect?: boolean
  readonly backendUrl: string
  readonly platform: number
}

export interface LoginResult {
  readonly authAccessToken?: string
  readonly authClientId?: string
  readonly authCode?: string
  readonly authCodeVerifier?: string
  readonly authErrorMessage: string
  readonly authRefreshToken?: string
  readonly userName?: string
  readonly userState: 'loggedOut' | 'loggingIn' | 'loggedIn'
  readonly userSubscriptionPlan?: string
  readonly userSubscriptionStatus?: string
  readonly userUsedTokens?: number
}
