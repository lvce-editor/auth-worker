import { expect, test } from '@jest/globals'
import type { LoginResponse } from '../src/parts/LoginResponse/LoginResponse.ts'
import { getLoggedInState } from '../src/parts/GetLoggedInState/GetLoggedInState.ts'
import { isLoginResponse } from '../src/parts/IsLoginResponse/IsLoginResponse.ts'

test('isLoginResponse returns false for null', () => {
  expect(isLoginResponse(null)).toBe(false)
})

test('isLoginResponse returns false for primitive value', () => {
  expect(isLoginResponse('test')).toBe(false)
})

test('isLoginResponse returns true for object value', () => {
  expect(isLoginResponse({ accessToken: 'token' })).toBe(true)
})

test('getLoggedInState applies login response values', () => {
  const state = {
    authAccessToken: '',
    authErrorMessage: 'previous error',
    userName: 'before',
    userState: 'loggingIn',
    userSubscriptionPlan: 'free',
    userUsedTokens: 1,
  }

  const response: LoginResponse = {
    accessToken: 'token-1',
    subscriptionPlan: 'pro',
    usedTokens: 42,
    userName: 'after',
  }

  expect(getLoggedInState(state, response)).toEqual({
    authAccessToken: 'token-1',
    authErrorMessage: '',
    userName: 'after',
    userState: 'loggedIn',
    userSubscriptionPlan: 'pro',
    userUsedTokens: 42,
  })
})

test('getLoggedInState falls back when response values are invalid', () => {
  const state = {
    authAccessToken: '',
    authErrorMessage: '',
    userName: 'before',
    userState: 'loggingIn',
    userSubscriptionPlan: 'free',
    userUsedTokens: 1,
  }

  const response = {
    accessToken: 1,
    subscriptionPlan: false,
    usedTokens: '2',
    userName: undefined,
  } as unknown as LoginResponse

  expect(getLoggedInState(state, response)).toEqual({
    authAccessToken: '',
    authErrorMessage: '',
    userName: 'before',
    userState: 'loggedOut',
    userSubscriptionPlan: 'free',
    userUsedTokens: 1,
  })
})
