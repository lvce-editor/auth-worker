import { afterEach, expect, jest, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
import { AuthProcess, MainProcess, OpenerWorker } from '@lvce-editor/rpc-registry'
import { configure } from '../src/parts/Configure/Configure.ts'
import { handleClickLogin } from '../src/parts/HandleClickLogin/HandleClickLogin.ts'
import { getPersistentAuthValue, clearPersistentAuthValue } from '../src/parts/PersistentAuthValue/PersistentAuthValue.ts'

const backendUrl = 'https://api.example.com'

afterEach(async () => {
  jest.restoreAllMocks()
  await configure({ platform: PlatformType.Web })
  await clearPersistentAuthValue('accessToken')
  await clearPersistentAuthValue('refreshToken')
})

test('native web shell uses the loopback client and persists tokens without Electron', async () => {
  await configure({ platform: PlatformType.Web, useNativeAuth: true })
  using main = MainProcess.registerMockRpc({})
  let sessionId = ''
  using auth = AuthProcess.registerMockRpc({
    'OAuthServer.create'(id: string): number {
      sessionId = id
      return 43_123
    },
    'OAuthServer.dispose'(id: string): void {
      expect(id).toBe(sessionId)
    },
    'OAuthServer.getCode'(id: string): string {
      expect(id).toBe(sessionId)
      return 'callback-code'
    },
  })
  using opener = OpenerWorker.registerMockRpc({
    'Open.openUrl'(href: string, platform: number, redirect: boolean): void {
      const url = new URL(href)
      expect(url.searchParams.get('client_id')).toBe('lvce-editor-native')
      expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:43123/callback')
      expect(url.searchParams.get('code_challenge_method')).toBe('S256')
      expect(platform).toBe(PlatformType.Web)
      expect(redirect).toBe(false)
    },
  })
  const fetchMock = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(Response.json({ access_token: 'native-token', refresh_token: 'refresh-token', token_type: 'Bearer' }))
    .mockResolvedValueOnce(Response.json({ displayName: 'Native User' }))
  const result = await handleClickLogin({ backendUrl, platform: PlatformType.Web })
  const body = new URLSearchParams(fetchMock.mock.calls[0]?.[1]?.body as URLSearchParams)
  expect(body.get('code')).toBe('callback-code')
  expect(body.get('client_id')).toBe('lvce-editor-native')
  expect(body.get('redirect_uri')).toBe('http://localhost:43123/callback')
  expect(body.get('code_verifier')).toBeTruthy()
  expect(result.userState).toBe('loggedIn')
  expect(result.authClientId).toBe('lvce-editor-native')
  expect(result.userName).toBe('Native User')
  expect(await getPersistentAuthValue('accessToken')).toBe('native-token')
  expect(main.invocations).toEqual([])
  expect(opener.invocations).toHaveLength(1)
  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(auth.invocations.at(-1)).toEqual(['OAuthServer.dispose', sessionId])
})

test('browser launch failure leaves logged-out state, disposes the listener, and permits retry', async () => {
  await configure({ platform: PlatformType.Web, useNativeAuth: true })
  const ids: string[] = []
  using auth = AuthProcess.registerMockRpc({
    'OAuthServer.create'(id: string): number {
      ids.push(id)
      return 43_123
    },
    'OAuthServer.dispose'(): void {},
  })
  using opener = OpenerWorker.registerMockRpc({
    'Open.openUrl'(): never {
      throw new Error('No default browser is available')
    },
  })
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await handleClickLogin({ backendUrl, platform: PlatformType.Web })
    expect(result.userState).toBe('loggedOut')
    expect(result.authErrorMessage).toContain('No default browser is available')
    expect(auth.invocations.at(-1)).toEqual(['OAuthServer.dispose', ids[attempt]])
  }
  expect(new Set(ids).size).toBe(2)
  expect(opener.invocations).toHaveLength(2)
})

test('abandoning the external browser times out and disposes the callback listener', async () => {
  await configure({ platform: PlatformType.Web, useNativeAuth: true })
  jest.useFakeTimers()
  try {
    const callback = Promise.withResolvers<void>()
    using auth = AuthProcess.registerMockRpc({
      'OAuthServer.create'(): number {
        return 43_123
      },
      'OAuthServer.dispose'(): void {},
      'OAuthServer.getCode'(): Promise<never> {
        callback.resolve()
        return new Promise(() => {})
      },
    })
    using opener = OpenerWorker.registerMockRpc({ 'Open.openUrl'(): void {} })
    const login = handleClickLogin({ backendUrl, platform: PlatformType.Web })
    await callback.promise
    await jest.advanceTimersByTimeAsync(31_000)
    const result = await login
    expect(result.userState).toBe('loggedOut')
    expect(result.authErrorMessage).toBe('Timed out waiting for backend login.')
    expect(auth.invocations.at(-1)?.[0]).toBe('OAuthServer.dispose')
    expect(opener.invocations).toHaveLength(1)
  } finally {
    jest.useRealTimers()
  }
})
