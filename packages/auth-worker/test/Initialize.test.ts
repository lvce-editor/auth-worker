import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'

const { oidcClientId } = await import('../src/parts/OidcConfig/OidcConfig.ts')
const { initialize } = await import('../src/parts/Initialize/Initialize.ts')
const { clearPendingOidcTransaction, setPendingOidcTransaction } = await import('../src/parts/PendingOidcTransaction/PendingOidcTransaction.ts')
const { clearStoredAuthError } = await import('../src/parts/StoredAuthError/StoredAuthError.ts')

const originalFetch = globalThis.fetch
const originalLocation = globalThis.location

const createResponse = (status: number, payload: unknown): Response => {
  return {
    json: async () => payload,
    ok: status >= 200 && status < 300,
    status,
  } as Response
}

beforeEach(async () => {
  await clearPendingOidcTransaction()
  await clearStoredAuthError()
})

afterEach(async () => {
  await clearPendingOidcTransaction()
  await clearStoredAuthError()
  globalThis.fetch = originalFetch
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: originalLocation,
  })
})

test('initialize processes a pending oidc callback and returns the synced backend auth state', async () => {
  await setPendingOidcTransaction({
    backendUrl: 'https://backend.example',
    codeVerifier: 'verifier-1',
    redirectUri: 'https://app.example/callback',
    state: 'state-1',
  })
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: {
      href: 'https://app.example/callback?code=code-1&state=state-1',
    },
  })
  const fetchMock = jest
    .fn<typeof fetch>()
    .mockResolvedValueOnce(createResponse(200, {}))
    .mockResolvedValueOnce(
      createResponse(200, {
        accessToken: 'access-1',
        subscriptionPlan: 'pro',
        usedTokens: 42,
        userName: 'Alice',
      }),
    )
  globalThis.fetch = fetchMock

  const result = await initialize({
    backendUrl: 'https://backend.example',
    platform: 1,
  })

  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(fetchMock.mock.calls[0]).toEqual([
    'https://backend.example/oidc/token',
    {
      body: JSON.stringify({
        client_id: oidcClientId,
        code: 'code-1',
        code_verifier: 'verifier-1',
        grant_type: 'authorization_code',
        redirect_uri: 'https://app.example/callback',
      }),
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  ])
  expect(fetchMock.mock.calls[1]).toEqual([
    'https://backend.example/auth/refresh',
    {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
      method: 'POST',
    },
  ])
  expect(result).toEqual({
    authAccessToken: 'access-1',
    authErrorMessage: '',
    userName: 'Alice',
    userState: 'loggedIn',
    userSubscriptionPlan: 'pro',
    userUsedTokens: 42,
  })
})
