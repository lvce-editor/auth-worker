import type { LoginResponse } from '../LoginResponse/LoginResponse.ts'

export const isLoginResponse = (value: unknown): value is LoginResponse => {
  if (!value || typeof value !== 'object') {
    return false
  }
  return true
}
