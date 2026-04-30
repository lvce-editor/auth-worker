import { expect, test } from '@jest/globals'
import type { LoginResponse } from '../src/parts/LoginResponse/LoginResponse.ts'
import { getLoggedInState } from '../src/parts/GetLoggedInState/GetLoggedInState.ts'
import { handleClickLogin } from '../src/parts/HandleClickLogin/HandleClickLogin.ts'
import { isLoginResponse } from '../src/parts/IsLoginResponse/IsLoginResponse.ts'
import * as MockBackendAuth from '../src/parts/MockBackendAuth/MockBackendAuth.ts'
import { clearPersistentAuthValue, getPersistentAuthValue } from '../src/parts/PersistentAuthValue/PersistentAuthValue.ts'

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
    authRefreshToken: '',
    userName: 'before',
    userState: 'loggingIn',
    userSubscriptionPlan: 'free',
    userUsedTokens: 1,
  }

  const response: LoginResponse = {
    accessToken: 'token-1',
    refreshToken: 'refresh-token-1',
    subscriptionPlan: 'pro',
    subscriptionStatus: 'active',
    usedTokens: 42,
    userName: 'after',
  }

  expect(getLoggedInState(state, response)).toEqual({
    authAccessToken: 'token-1',
    authErrorMessage: '',
    authRefreshToken: 'refresh-token-1',
    userName: 'after',
    userState: 'loggedIn',
    userSubscriptionPlan: 'pro',
    userSubscriptionStatus: 'active',
    userUsedTokens: 42,
  })
})

test('getLoggedInState falls back when response values are invalid', () => {
  const state = {
    authAccessToken: '',
    authErrorMessage: '',
    authRefreshToken: '',
    userName: 'before',
    userState: 'loggingIn',
    userSubscriptionPlan: 'free',
    userUsedTokens: 1,
  }

  const response = {
    accessToken: 1,
    refreshToken: false,
    subscriptionPlan: false,
    subscriptionStatus: false,
    usedTokens: '2',
    userName: undefined,
  } as unknown as LoginResponse

  expect(getLoggedInState(state, response)).toEqual({
    authAccessToken: '',
    authErrorMessage: '',
    authRefreshToken: '',
    userName: 'before',
    userState: 'loggedOut',
    userSubscriptionPlan: 'free',
    userSubscriptionStatus: undefined,
    userUsedTokens: 1,
  })
})

test('handleClickLogin stores access token and refresh token after successful login', async () => {
  MockBackendAuth.clear()
  await clearPersistentAuthValue('accessToken')
  await clearPersistentAuthValue('refreshToken')
  MockBackendAuth.setNextLoginResponse({
    delay: 0,
    response: {
      accessToken: 'token-1',
      refreshToken: 'refresh-token-1',
    },
    type: 'success',
  })

  const result = await handleClickLogin({
    backendUrl: 'https://api.example.com',
    platform: 0,
  })

  expect(result).toEqual({
    authAccessToken: 'token-1',
    authErrorMessage: '',
    authRefreshToken: 'refresh-token-1',
    userName: undefined,
    userState: 'loggedIn',
    userSubscriptionPlan: undefined,
    userSubscriptionStatus: undefined,
    userUsedTokens: undefined,
  })
  expect(await getPersistentAuthValue('accessToken')).toBe('token-1')
  expect(await getPersistentAuthValue('refreshToken')).toBe('refresh-token-1')

  MockBackendAuth.clear()
  await clearPersistentAuthValue('accessToken')
  await clearPersistentAuthValue('refreshToken')
})
