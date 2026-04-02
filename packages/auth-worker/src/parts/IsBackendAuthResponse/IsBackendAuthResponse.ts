import type { BackendAuthResponse } from '../BackendAuthResponse/BackendAuthResponse.ts'
import { isObject } from '../IsObject/IsObject.ts'

export const isBackendAuthResponse = (value: unknown): value is BackendAuthResponse => {
  return isObject(value)
}
