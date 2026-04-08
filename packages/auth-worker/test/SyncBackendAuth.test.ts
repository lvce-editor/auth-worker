import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'

const { syncBackendAuth } = await import('../src/parts/SyncBackendAuth/SyncBackendAuth.ts')

const originalFetch = globalThis.fetch

const createResponse = (status: number, payload: unknown): Response => {
  return {
    json: async () => payload,
    ok: status >= 200 && status < 300,
    status,
  } as Response
}

beforeEach(() => {})

afterEach(() => {
  globalThis.fetch = originalFetch
})

test('syncBackendAuth uses cookie credentials and parses the access token from response payload', async () => {
  const fetchMock = jest.fn<typeof fetch>().mockResolvedValue(
    createResponse(200, {
      accessToken: 'access-1',
      subscriptionPlan: 'pro',
      usedTokens: 42,
      userName: 'Alice',
    }),
  )
  globalThis.fetch = fetchMock

  const result = await syncBackendAuth('https://backend.example')

  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(fetchMock).toHaveBeenCalledWith('https://backend.example/auth/refresh', {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
    method: 'POST',
  })
  expect(result).toEqual({
    authAccessToken: 'access-1',
    authErrorMessage: '',
    userName: 'Alice',
    userState: 'loggedIn',
    userSubscriptionPlan: 'pro',
    userUsedTokens: 42,
  })
})

test('syncBackendAuth returns logged out on unauthorized response', async () => {
  const fetchMock = jest.fn<typeof fetch>().mockResolvedValue(createResponse(401, { error: 'unauthorized' }))
  globalThis.fetch = fetchMock

  const result = await syncBackendAuth('https://backend.example')

  expect(result).toEqual({
    authAccessToken: '',
    authErrorMessage: '',
    userState: 'loggedOut',
  })
})
