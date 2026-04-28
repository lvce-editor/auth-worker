import { expect, test } from '@jest/globals'
import { parseBackendAuthResponse } from '../src/parts/ParseBackendAuthResponse/ParseBackendAuthResponse.ts'

test('parseBackendAuthResponse returns logged out state for invalid responses', () => {
  const result = parseBackendAuthResponse(undefined)

  expect(result).toEqual({
    authAccessToken: '',
    authErrorMessage: 'Backend returned an invalid authentication response.',
    userState: 'loggedOut',
  })
})

test('parseBackendAuthResponse normalizes valid backend auth responses', () => {
  const result = parseBackendAuthResponse({
    accessToken: 'token-1',
    error: 404,
    subscriptionPlan: 'pro',
    usedTokens: '7',
    userName: 'Ada',
  })

  expect(result).toEqual({
    authAccessToken: 'token-1',
    authErrorMessage: '',
    userName: 'Ada',
    userState: 'loggedIn',
    userSubscriptionPlan: 'pro',
    userUsedTokens: 0,
  })
})

test('parseBackendAuthResponse returns logged out state for object responses without access token', () => {
  const result = parseBackendAuthResponse({
    accessToken: '',
    error: 'missing token',
    subscriptionPlan: 1,
    usedTokens: 5,
    userName: false,
  })

  expect(result).toEqual({
    authAccessToken: '',
    authErrorMessage: 'missing token',
    userName: '',
    userState: 'loggedOut',
    userSubscriptionPlan: '',
    userUsedTokens: 5,
  })
})
