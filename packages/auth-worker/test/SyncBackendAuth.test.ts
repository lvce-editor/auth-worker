import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'

const { syncBackendAuth } = await import('../src/parts/SyncBackendAuth/SyncBackendAuth.ts')
const { clearStoredRefreshToken, getStoredRefreshToken, setStoredRefreshToken } =
  await import('../src/parts/StoredRefreshToken/StoredRefreshToken.ts')

const originalFetch = globalThis.fetch

const createResponse = (status: number, payload: unknown): Response => {
  return {
    json: async () => payload,
    ok: status >= 200 && status < 300,
    status,
  } as Response
}

beforeEach(() => {
  clearStoredRefreshToken()
})

afterEach(() => {
  clearStoredRefreshToken()
  globalThis.fetch = originalFetch
})

test('syncBackendAuth sends stored refresh token and rotates it from response payload', async () => {
  setStoredRefreshToken('refresh-1')
  const fetchMock = jest.fn<typeof fetch>().mockResolvedValue(
    createResponse(200, {
      accessToken: 'access-1',
      refreshToken: 'refresh-2',
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
      Authorization: 'Bearer refresh-1',
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
  expect(getStoredRefreshToken()).toBe('refresh-2')
})

test('syncBackendAuth clears stored refresh token on unauthorized response', async () => {
  setStoredRefreshToken('refresh-1')
  const fetchMock = jest.fn<typeof fetch>().mockResolvedValue(createResponse(401, { error: 'unauthorized' }))
  globalThis.fetch = fetchMock

  const result = await syncBackendAuth('https://backend.example')

  expect(result).toEqual({
    authAccessToken: '',
    authErrorMessage: '',
    userState: 'loggedOut',
  })
  expect(getStoredRefreshToken()).toBe('')
})
