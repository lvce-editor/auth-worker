import { delay } from '../Delay/Delay.ts'

export interface MockBackendAuthSuccess {
  readonly delay: number
  readonly response: unknown
  readonly type: 'success'
}

export interface MockBackendAuthError {
  readonly delay: number
  readonly message: string
  readonly type: 'error'
}

export type MockBackendAuthResponse = MockBackendAuthSuccess | MockBackendAuthError

interface MockBackendAuthState {
  nextLoginResponse: MockBackendAuthResponse | undefined
  nextRefreshResponse: MockBackendAuthResponse | undefined
}

const state: MockBackendAuthState = {
  nextLoginResponse: undefined,
  nextRefreshResponse: undefined,
}

export const setNextLoginResponse = (response: MockBackendAuthResponse): void => {
  state.nextLoginResponse = response
}

export const setNextRefreshResponse = (response: MockBackendAuthResponse): void => {
  state.nextRefreshResponse = response
}

export const clear = (): void => {
  state.nextLoginResponse = undefined
  state.nextRefreshResponse = undefined
}

export const hasPendingMockLoginResponse = (): boolean => {
  return !!state.nextLoginResponse
}

export const hasPendingMockRefreshResponse = (): boolean => {
  return !!state.nextRefreshResponse
}

export const consumeNextLoginResponse = async (): Promise<unknown> => {
  if (!state.nextLoginResponse) {
    return undefined
  }
  const response = state.nextLoginResponse
  state.nextLoginResponse = undefined
  if (response.delay > 0) {
    await delay(response.delay)
  }
  if (response.type === 'error') {
    throw new Error(response.message)
  }
  return response.response
}

export const consumeNextRefreshResponse = async (): Promise<unknown> => {
  if (!state.nextRefreshResponse) {
    return undefined
  }
  const response = state.nextRefreshResponse
  state.nextRefreshResponse = undefined
  if (response.delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, response.delay))
  }
  if (response.type === 'error') {
    throw new Error(response.message)
  }
  return response.response
}
