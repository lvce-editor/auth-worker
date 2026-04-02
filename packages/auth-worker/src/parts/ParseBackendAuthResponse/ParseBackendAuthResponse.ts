import type { BackendAuthState } from '../BackendAuthState/BackendAuthState.ts'
import { getLoggedOutBackendAuthState } from '../GetLoggedOutBackendAuthState/GetLoggedOutBackendAuthState.ts'
import { isBackendAuthResponse } from '../IsBackendAuthResponse/IsBackendAuthResponse.ts'
import { toBackendAuthState } from '../ToBackendAuthState/ToBackendAuthState.ts'

export const parseBackendAuthResponse = (value: unknown): BackendAuthState => {
  if (!isBackendAuthResponse(value)) {
    return getLoggedOutBackendAuthState('Backend returned an invalid authentication response.')
  }
  return toBackendAuthState(value)
}
