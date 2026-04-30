export interface BackendAuthResponse {
  readonly accessToken?: string
  readonly error?: string
  readonly refreshToken?: string
  readonly subscriptionPlan?: string
  readonly subscriptionStatus?: string
  readonly usedTokens?: number
  readonly user?: {
    readonly displayName?: string
  }
  readonly userName?: string
}
