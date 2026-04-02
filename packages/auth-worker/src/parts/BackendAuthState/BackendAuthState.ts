import type { AuthUserState } from '../../AuthUserState/AuthUserState.ts'

export interface BackendAuthState {
  readonly authAccessToken: string
  readonly authErrorMessage: string
  readonly userName: string
  readonly userState: AuthUserState
  readonly userSubscriptionPlan: string
  readonly userUsedTokens: number
}
