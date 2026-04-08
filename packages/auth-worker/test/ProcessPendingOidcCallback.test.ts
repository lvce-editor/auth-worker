import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'

const { oidcClientId } = await import('../src/parts/OidcConfig/OidcConfig.ts')
const { processPendingOidcCallback } = await import('../src/parts/ProcessPendingOidcCallback/ProcessPendingOidcCallback.ts')
const { clearPendingOidcTransaction, getPendingOidcTransaction, setPendingOidcTransaction } =
  await import('../src/parts/PendingOidcTransaction/PendingOidcTransaction.ts')
const { clearStoredAuthError, getStoredAuthError } = await import('../src/parts/StoredAuthError/StoredAuthError.ts')

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

test('processPendingOidcCallback exchanges the authorization code using credentialed requests', async () => {
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
  const fetchMock = jest.fn<typeof fetch>().mockResolvedValue(createResponse(200, {}))
  globalThis.fetch = fetchMock

  const result = await processPendingOidcCallback()

  expect(result).toBe(true)
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(fetchMock).toHaveBeenCalledWith('https://backend.example/oidc/token', {
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
  })
  expect(await getPendingOidcTransaction()).toEqual(undefined)
  expect(await getStoredAuthError()).toBe('')
})

test('processPendingOidcCallback stores an error when the callback state does not match', async () => {
  await setPendingOidcTransaction({
    backendUrl: 'https://backend.example',
    codeVerifier: 'verifier-1',
    redirectUri: 'https://app.example/callback',
    state: 'expected-state',
  })
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: {
      href: 'https://app.example/callback?code=code-1&state=actual-state',
    },
  })
  const fetchMock = jest.fn<typeof fetch>()
  globalThis.fetch = fetchMock

  const result = await processPendingOidcCallback()

  expect(result).toBe(false)
  expect(fetchMock).toHaveBeenCalledTimes(0)
  expect(await getPendingOidcTransaction()).toEqual(undefined)
  expect(await getStoredAuthError()).toBe('Backend authentication failed: invalid state parameter.')
})

test('processPendingOidcCallback ignores repeated callback urls when no transaction is pending', async () => {
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: {
      href: 'https://app.example/callback?code=code-1&state=state-1',
    },
  })
  const fetchMock = jest.fn<typeof fetch>()
  globalThis.fetch = fetchMock

  const result = await processPendingOidcCallback()

  expect(result).toBe(false)
  expect(fetchMock).toHaveBeenCalledTimes(0)
  expect(await getStoredAuthError()).toBe('')
})
