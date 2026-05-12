import { afterEach, expect, test } from '@jest/globals'
import { initialize } from '../src/parts/Initialize/Initialize.ts'
import {
  clearOidcCallbackUrl,
  clearPendingOidcAuthState,
  saveOidcCallbackUrl,
  savePendingOidcAuthState,
} from '../src/parts/OidcAuthState/OidcAuthState.ts'
import { clearPersistedAuthSession, getPersistedAuthSession, persistAuthSession } from '../src/parts/PersistedAuthSession/PersistedAuthSession.ts'

const originalFetch = globalThis.fetch

const setFetch = (value: typeof fetch): void => {
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    value,
    writable: true,
  })
}

const getRequestUrl = (input: unknown): string => {
  if (typeof input === 'string') {
    return input
  }
  if (input instanceof URL) {
    return input.toString()
  }
  if (input instanceof Request) {
    return input.url
  }
  return ''
}

afterEach(async () => {
  setFetch(originalFetch)
  await clearOidcCallbackUrl()
  await clearPendingOidcAuthState()
  await clearPersistedAuthSession()
})

test('initialize returns the persisted auth session without backend requests', async () => {
  await persistAuthSession({
    authAccessToken: 'token-1',
    authClientId: 'lvce-editor-web',
    authErrorMessage: '',
    authRefreshToken: 'refresh-token-1',
    userName: 'Persisted User',
    userState: 'loggedIn',
    userSubscriptionPlan: 'pro',
    userSubscriptionStatus: 'active',
    userUsedTokens: 42,
  })

  const fetchCalls: unknown[] = []
  const mockFetch: typeof fetch = async (...args: readonly unknown[]) => {
    fetchCalls.push(args)
    throw new Error('fetch should not be called during initialize')
  }
  setFetch(mockFetch)

  await expect(initialize({ backendUrl: 'https://client.test/' })).resolves.toEqual({
    authAccessToken: 'token-1',
    authClientId: 'lvce-editor-web',
    authErrorMessage: '',
    authRefreshToken: 'refresh-token-1',
    userName: 'Persisted User',
    userState: 'loggedIn',
    userSubscriptionPlan: 'pro',
    userSubscriptionStatus: 'active',
    userUsedTokens: 42,
  })

  expect(fetchCalls).toEqual([])
})

test('initialize completes a pending callback and persists the resulting auth session', async () => {
  await savePendingOidcAuthState({
    clientId: 'lvce-editor-web',
    codeVerifier: 'verifier-1',
    redirectUri: 'https://client.test/auth/callback',
    state: 'state-1',
  })
  await saveOidcCallbackUrl('https://client.test/auth/callback?code=code-1&state=state-1')

  const fetchCalls: unknown[] = []
  const mockFetch: typeof fetch = async (...args: readonly unknown[]): Promise<Response> => {
    fetchCalls.push(args)
    const url = getRequestUrl(args[0])
    if (url === 'https://client.test/account/me') {
      return Response.json({ displayName: 'Callback User' })
    }
    return Response.json({
      access_token: 'oidc-access-token-1',
      refresh_token: 'oidc-refresh-token-1',
      token_type: 'bearer',
    })
  }
  setFetch(mockFetch)

  await expect(initialize({ backendUrl: 'https://client.test/' })).resolves.toEqual({
    authAccessToken: 'oidc-access-token-1',
    authClientId: 'lvce-editor-web',
    authErrorMessage: '',
    authRefreshToken: 'oidc-refresh-token-1',
    userName: 'Callback User',
    userState: 'loggedIn',
  })

  await expect(getPersistedAuthSession()).resolves.toEqual({
    authAccessToken: 'oidc-access-token-1',
    authClientId: 'lvce-editor-web',
    authErrorMessage: '',
    authRefreshToken: 'oidc-refresh-token-1',
    userName: 'Callback User',
    userState: 'loggedIn',
    userSubscriptionPlan: undefined,
    userSubscriptionStatus: undefined,
    userUsedTokens: undefined,
  })

  setFetch(async () => {
    throw new Error('fetch should not be called on subsequent initialize')
  })

  await expect(initialize({ backendUrl: 'https://client.test/' })).resolves.toEqual({
    authAccessToken: 'oidc-access-token-1',
    authClientId: 'lvce-editor-web',
    authErrorMessage: '',
    authRefreshToken: 'oidc-refresh-token-1',
    userName: 'Callback User',
    userState: 'loggedIn',
    userSubscriptionPlan: undefined,
    userSubscriptionStatus: undefined,
    userUsedTokens: undefined,
  })

  expect(fetchCalls).toHaveLength(2)
})

test('initialize returns logged out when no persisted auth session exists', async () => {
  const fetchCalls: unknown[] = []
  const mockFetch: typeof fetch = async (...args: readonly unknown[]) => {
    fetchCalls.push(args)
    throw new Error('fetch should not be called during initialize')
  }
  setFetch(mockFetch)

  await expect(initialize({ backendUrl: 'https://client.test/' })).resolves.toEqual({
    authAccessToken: '',
    authErrorMessage: '',
    userState: 'loggedOut',
  })

  expect(fetchCalls).toEqual([])
})
