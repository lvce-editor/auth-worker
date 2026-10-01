import { afterEach, expect, test } from '@jest/globals'
import { setAuthBackendUrl } from '../src/parts/AuthBackendUrl/AuthBackendUrl.ts'
import { getAccessToken } from '../src/parts/GetAccessToken/GetAccessToken.ts'
import { clearStoredOidcClientId, saveOidcClientId } from '../src/parts/OidcAuthState/OidcAuthState.ts'
import { clearPersistentAuthValue, getPersistentAuthValue, setPersistentAuthValue } from '../src/parts/PersistentAuthValue/PersistentAuthValue.ts'

afterEach(async () => {
  setAuthBackendUrl('')
  await Promise.all([
    clearPersistentAuthValue('accessToken'),
    clearPersistentAuthValue('accessTokenExpiresAt'),
    clearPersistentAuthValue('refreshToken'),
    clearStoredOidcClientId(),
  ])
})

test('returns the persisted access token', async () => {
  await setPersistentAuthValue('accessToken', 'token-1')

  await expect(getAccessToken()).resolves.toBe('token-1')
})

test('returns an empty string when no access token is persisted', async () => {
  await expect(getAccessToken()).resolves.toBe('')
})

test('returns an unexpired access token without refreshing', async () => {
  await Promise.all([setPersistentAuthValue('accessToken', 'token-1'), setPersistentAuthValue('accessTokenExpiresAt', '2000')])
  const refreshTokens = async (): Promise<never> => {
    throw new Error('refresh should not be called')
  }

  await expect(getAccessToken({ refresh: 'if-needed' }, refreshTokens, 1000)).resolves.toBe('token-1')
})

test('refreshes and persists an expired access token', async () => {
  setAuthBackendUrl('https://api.example.com/')
  await Promise.all([
    setPersistentAuthValue('accessToken', 'token-1'),
    setPersistentAuthValue('accessTokenExpiresAt', '1000'),
    setPersistentAuthValue('refreshToken', 'refresh-token-1'),
    saveOidcClientId('lvce-editor-web'),
  ])
  const refreshCalls: Array<readonly [string, string, string]> = []
  const refreshTokens = async (
    backendUrl: string,
    clientId: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; expiresIn: number; refreshToken: string }> => {
    refreshCalls.push([backendUrl, clientId, refreshToken])
    return {
      accessToken: 'token-2',
      expiresIn: 3600,
      refreshToken: 'refresh-token-2',
    }
  }

  await expect(getAccessToken({ refresh: 'if-needed' }, refreshTokens, 2000)).resolves.toBe('token-2')
  expect(refreshCalls).toEqual([['https://api.example.com/', 'lvce-editor-web', 'refresh-token-1']])
  await expect(
    Promise.all([getPersistentAuthValue('accessToken'), getPersistentAuthValue('accessTokenExpiresAt'), getPersistentAuthValue('refreshToken')]),
  ).resolves.toEqual(['token-2', '3602000', 'refresh-token-2'])
  await expect(getAccessToken({ refresh: 'if-needed' }, refreshTokens, 3000)).resolves.toBe('token-2')
})

test('returns the stored token when refresh metadata is unavailable', async () => {
  await setPersistentAuthValue('accessToken', 'legacy-token')

  await expect(
    getAccessToken({ refresh: 'if-needed' }, async () => {
      throw new Error('refresh should not be called')
    }),
  ).resolves.toBe('legacy-token')
})

test.each(['refreshToken', 'clientId', 'backendUrl'])('does not return a known expired token when %s is missing', async (missing) => {
  setAuthBackendUrl(missing === 'backendUrl' ? '' : 'https://api.example.com/')
  await Promise.all([
    setPersistentAuthValue('accessToken', 'expired-token'),
    setPersistentAuthValue('accessTokenExpiresAt', '1000'),
    setPersistentAuthValue('refreshToken', missing === 'refreshToken' ? '' : 'refresh-token'),
    ...(missing === 'clientId' ? [] : [saveOidcClientId('lvce-editor-web')]),
  ])
  const refreshTokens = async (): Promise<never> => {
    throw new Error('refresh should not be called without credentials')
  }

  await expect(getAccessToken({ refresh: 'if-needed' }, refreshTokens, 2000)).resolves.toBe('')
  await expect(getAccessToken()).resolves.toBe('expired-token')
})

test('forces refresh of a server-rejected token before its recorded expiry', async () => {
  setAuthBackendUrl('https://api.example.com/')
  await Promise.all([
    setPersistentAuthValue('accessToken', 'rejected-token'),
    setPersistentAuthValue('accessTokenExpiresAt', '9999999'),
    setPersistentAuthValue('refreshToken', 'refresh-1'),
    saveOidcClientId('lvce-editor-web'),
  ])
  let calls = 0
  const refreshTokens = async () => {
    calls++
    return { accessToken: 'fresh-token', expiresIn: 3600, refreshToken: 'refresh-2' }
  }
  await expect(getAccessToken({ refresh: 'always' }, refreshTokens, 2000)).resolves.toBe('fresh-token')
  expect(calls).toBe(1)
  await expect(
    Promise.all([getPersistentAuthValue('accessToken'), getPersistentAuthValue('accessTokenExpiresAt'), getPersistentAuthValue('refreshToken')]),
  ).resolves.toEqual(['fresh-token', '3602000', 'refresh-2'])
})

test.each(['refreshToken', 'clientId', 'backendUrl'])('does not reuse a rejected token when %s is missing', async (missing) => {
  setAuthBackendUrl(missing === 'backendUrl' ? '' : 'https://api.example.com/')
  await Promise.all([
    setPersistentAuthValue('accessToken', 'rejected-token'),
    setPersistentAuthValue('accessTokenExpiresAt', '9999999'),
    setPersistentAuthValue('refreshToken', missing === 'refreshToken' ? '' : 'refresh-1'),
    ...(missing === 'clientId' ? [] : [saveOidcClientId('lvce-editor-web')]),
  ])
  await expect(
    getAccessToken(
      { refresh: 'always' },
      async () => {
        throw new Error('refresh must not be called without metadata')
      },
      2000,
    ),
  ).resolves.toBe('')
})

test('propagates rejected forced refresh without returning the rejected access token', async () => {
  setAuthBackendUrl('https://api.example.com/')
  await Promise.all([
    setPersistentAuthValue('accessToken', 'rejected-token'),
    setPersistentAuthValue('accessTokenExpiresAt', '9999999'),
    setPersistentAuthValue('refreshToken', 'refresh-1'),
    saveOidcClientId('lvce-editor-web'),
  ])
  await expect(
    getAccessToken(
      { refresh: 'always' },
      async () => {
        throw new Error('refresh rejected')
      },
      2000,
    ),
  ).rejects.toThrow('refresh rejected')
  await expect(getPersistentAuthValue('refreshToken')).resolves.toBe('refresh-1')
})
