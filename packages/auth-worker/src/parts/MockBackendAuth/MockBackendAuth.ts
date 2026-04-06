import { delay } from '../Delay/Delay.ts'

interface MockBackendAuthSuccess {
  readonly delay: number
  readonly response: unknown
  readonly type: 'success'
}

interface MockBackendAuthError {
  readonly delay: number
  readonly message: string
  readonly type: 'error'
}

type MockBackendAuthResponse = MockBackendAuthSuccess | MockBackendAuthError

let nextLoginResponse: MockBackendAuthResponse | undefined

export const setNextLoginResponse = (response: MockBackendAuthResponse): void => {
  nextLoginResponse = response
}

export const clear = (): void => {
  nextLoginResponse = undefined
}

export const hasPendingMockLoginResponse = (): boolean => {
  return !!nextLoginResponse
}

export const consumeNextLoginResponse = async (): Promise<unknown> => {
  if (!nextLoginResponse) {
    return undefined
  }
  const response = nextLoginResponse
  nextLoginResponse = undefined
  if (response.delay > 0) {
    await delay(response.delay)
  }
  if (response.type === 'error') {
    throw new Error(response.message)
  }
  return response.response
}
