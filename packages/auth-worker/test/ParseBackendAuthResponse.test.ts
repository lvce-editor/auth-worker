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
    refreshToken: 'refresh-token-1',
    subscriptionPlan: 'pro',
    subscriptionStatus: 'active',
    usedTokens: '7',
    userName: 'Ada',
  })

  expect(result).toEqual({
    authAccessToken: 'token-1',
    authErrorMessage: '',
    authRefreshToken: 'refresh-token-1',
    userName: 'Ada',
    userState: 'loggedIn',
    userSubscriptionPlan: 'pro',
    userSubscriptionStatus: 'active',
    userUsedTokens: 0,
  })
})

test('parseBackendAuthResponse normalizes nested backend auth responses', () => {
  const result = parseBackendAuthResponse({
    accessToken: 'token-1',
    subscriptionPlan: 'pro-plus',
    subscriptionStatus: 'trialing',
    usedTokens: 7,
    user: {
      displayName: 'Ada',
    },
  })

  expect(result).toEqual({
    authAccessToken: 'token-1',
    authErrorMessage: '',
    authRefreshToken: '',
    userName: 'Ada',
    userState: 'loggedIn',
    userSubscriptionPlan: 'pro-plus',
    userSubscriptionStatus: 'trialing',
    userUsedTokens: 7,
  })
})

test('parseBackendAuthResponse returns logged out state for object responses without access token', () => {
  const result = parseBackendAuthResponse({
    accessToken: '',
    error: 'missing token',
    refreshToken: 1,
    subscriptionPlan: 1,
    usedTokens: 5,
    userName: false,
  })

  expect(result).toEqual({
    authAccessToken: '',
    authErrorMessage: 'missing token',
    authRefreshToken: '',
    userName: '',
    userState: 'loggedOut',
    userSubscriptionPlan: '',
    userSubscriptionStatus: '',
    userUsedTokens: 5,
  })
})
