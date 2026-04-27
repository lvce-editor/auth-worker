import { afterEach, expect, test } from '@jest/globals'
import { logoutFromBackend } from '../src/parts/LogoutFromBackend/LogoutFromBackend.ts'

const originalFetch = globalThis.fetch

const setFetch = (value: typeof fetch): void => {
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    value,
    writable: true,
  })
}

afterEach(() => {
  setFetch(originalFetch)
})

test('logoutFromBackend does nothing when backend url is empty', async () => {
  const fetchCalls: unknown[] = []
  const mockFetch: typeof fetch = async (...args: readonly [input: RequestInfo | URL, init?: RequestInit]) => {
    fetchCalls.push(args)
    return new Response()
  }
  setFetch(mockFetch)

  await expect(logoutFromBackend('')).resolves.toBeUndefined()

  expect(fetchCalls).toEqual([])
})

test('logoutFromBackend posts to the backend logout endpoint', async () => {
  const fetchCalls: unknown[] = []
  const mockFetch: typeof fetch = async (...args: readonly [input: RequestInfo | URL, init?: RequestInit]) => {
    fetchCalls.push(args)
    return new Response()
  }
  setFetch(mockFetch)

  await expect(logoutFromBackend('https://api.example.com///')).resolves.toBeUndefined()

  expect(fetchCalls).toEqual([
    [
      'https://api.example.com/auth/logout',
      {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
        method: 'POST',
      },
    ],
  ])
})

test('logoutFromBackend ignores fetch failures', async () => {
  const fetchCalls: unknown[] = []
  const mockFetch: typeof fetch = async (...args: readonly [input: RequestInfo | URL, init?: RequestInit]) => {
    fetchCalls.push(args)
    throw new Error('network error')
  }
  setFetch(mockFetch)

  await expect(logoutFromBackend('https://api.example.com')).resolves.toBeUndefined()

  expect(fetchCalls).toEqual([
    [
      'https://api.example.com/auth/logout',
      {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
        method: 'POST',
      },
    ],
  ])
})
