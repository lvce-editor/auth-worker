import type { LoginResponse } from '../LoginResponse/LoginResponse.ts'

export const isLoginResponse = (value: unknown): value is LoginResponse => {
  return !!value && typeof value === 'object'
}
