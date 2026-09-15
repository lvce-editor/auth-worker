import { afterEach, expect, jest, test } from '@jest/globals'
import { clearPersistedAuthSession, getPersistedAuthSession } from '../src/parts/PersistedAuthSession/PersistedAuthSession.ts'
import { syncBackendAuth } from '../src/parts/SyncBackendAuth/SyncBackendAuth.ts'

afterEach(async () => {
  jest.restoreAllMocks()
  await clearPersistedAuthSession()
})

test('persists the access token returned by the cookie session refresh', async () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
    Response.json({
      accessToken: 'cookie-session-token',
      userName: 'Ada',
    }),
  )

  await expect(syncBackendAuth('https://client.test/')).resolves.toEqual({
    authAccessToken: 'cookie-session-token',
    authErrorMessage: '',
    authRefreshToken: '',
    userName: 'Ada',
    userState: 'loggedIn',
    userSubscriptionPlan: '',
    userSubscriptionStatus: '',
    userUsedTokens: 0,
  })
  expect(fetchMock).toHaveBeenCalledWith(
    'https://client.test/auth/refresh',
    expect.objectContaining({
      credentials: 'include',
      method: 'POST',
    }),
  )
  await expect(getPersistedAuthSession()).resolves.toEqual(
    expect.objectContaining({
      authAccessToken: 'cookie-session-token',
      userName: 'Ada',
      userState: 'loggedIn',
    }),
  )
})
