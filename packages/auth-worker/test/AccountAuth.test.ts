import { expect, jest, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
import * as AccountAuth from '../src/parts/AccountAuth/AccountAuth.ts'
import { setAuthBackendUrl } from '../src/parts/AuthBackendUrl/AuthBackendUrl.ts'
import { setAuthPlatform } from '../src/parts/AuthPlatform/AuthPlatform.ts'
import { clear, setNextLoginResponse } from '../src/parts/MockBackendAuth/MockBackendAuth.ts'
import { persistAuthSession } from '../src/parts/PersistedAuthSession/PersistedAuthSession.ts'
import { getPersistentAuthValue } from '../src/parts/PersistentAuthValue/PersistentAuthValue.ts'

const backendUrl = 'https://backend.test'

test('RPC session lifecycle migrates, adds, switches, deduplicates and preserves sessions on failed login', async () => {
  setAuthBackendUrl(backendUrl)
  setAuthPlatform(PlatformType.Web)
  await persistAuthSession({
    authAccessToken: 'access-A',
    authClientId: 'client',
    authErrorMessage: '',
    authRefreshToken: 'refresh-A',
    userState: 'loggedIn',
  })
  const calls: string[] = []
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(async (...args: readonly unknown[]): Promise<Response> => {
    const input = args[0]
    const fallbackUrl = input instanceof URL ? input.href : ''
    const url = typeof input === 'string' ? input : fallbackUrl
    const options = args[1] as { readonly headers?: Record<string, string> }

    calls.push(url)
    if (url.endsWith('/account/me')) {
      const id = new Headers(options.headers).get('Authorization') === 'Bearer access-B' ? 'B' : 'A'
      return Response.json({ displayName: `User ${id}`, id })
    }
    return Response.json({ access_token: 'access-A2', expires_in: 3600, refresh_token: 'refresh-A2', token_type: 'bearer' })
  })
  try {
    expect(await AccountAuth.getAccounts()).toMatchObject([{ active: true, displayName: 'User A', id: `${backendUrl}/A` }])
    expect(await getPersistentAuthValue('accessToken')).toBe('')
    setNextLoginResponse({ delay: 0, response: { accessToken: 'access-B', refreshToken: 'refresh-B' }, type: 'success' })
    expect(await AccountAuth.login({ backendUrl, platform: PlatformType.Web })).toMatchObject({ authAccessToken: 'access-B', userName: 'User B' })
    const list = await AccountAuth.getAccounts()
    expect(list.map((account: Readonly<{ active: boolean }>) => account.active)).toEqual([false, true])
    expect(JSON.stringify(list)).not.toContain('access-')
    expect(JSON.stringify(list)).not.toContain('refresh-')
    await AccountAuth.useAccount(`${backendUrl}/A`)
    expect(await AccountAuth.getAccessToken({ refresh: 'always' })).toBe('access-A2')
    setNextLoginResponse({ delay: 0, message: 'Login cancelled.', type: 'error' })
    expect(await AccountAuth.login({ backendUrl, platform: PlatformType.Web })).toMatchObject({
      authAccessToken: 'access-A2',
      authErrorMessage: 'Login cancelled.',
      userState: 'loggedIn',
    })
    expect(await AccountAuth.getAccounts()).toHaveLength(2)
    setNextLoginResponse({ delay: 0, response: { accessToken: 'access-B', refreshToken: 'refresh-B' }, type: 'success' })
    await AccountAuth.login({ backendUrl, platform: PlatformType.Web })
    expect(await AccountAuth.getAccounts()).toHaveLength(2)
    expect(await AccountAuth.logout()).toMatchObject({ authAccessToken: 'access-A2' })
    expect(await AccountAuth.getAccounts()).toHaveLength(1)
    await AccountAuth.logout()
    expect(await AccountAuth.getAccessToken()).toBe('')
    expect(await AccountAuth.initialize({ backendUrl })).toMatchObject({ userState: 'loggedOut' })
    expect(calls.every((url) => !url.endsWith('/auth/refresh'))).toBe(true)
  } finally {
    fetchMock.mockRestore()
    clear()
  }
})

test('loads and disconnects connected provider accounts using only the active bearer token', async () => {
  setAuthBackendUrl(backendUrl)
  const { setPersistentAuthValue } = await import('../src/parts/PersistentAuthValue/PersistentAuthValue.ts')
  await setPersistentAuthValue(
    'accountSessions',
    JSON.stringify({
      accounts: [
        {
          backendUrl,
          id: `${backendUrl}/A`,
          profile: { displayName: 'User A', email: '', id: 'A', provider: 'LVCE Editor' },
          session: { authAccessToken: 'active-access', authErrorMessage: '', userState: 'loggedIn' },
        },
      ],
      activeId: `${backendUrl}/A`,
      revision: 0,
    }),
  )
  let connected = true
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(async (...args: readonly unknown[]): Promise<Response> => {
    const options = args[1] as { readonly headers: HeadersInit; readonly method?: string }
    expect(new Headers(options.headers).get('Authorization')).toBe('Bearer active-access')
    if (options.method === 'POST') {
      connected = false
      return Response.json({ disconnected: true })
    }
    return Response.json({ connections: connected ? [{ id: 'openrouter', name: 'OpenRouter', provider: 'OpenRouter' }] : [] })
  })
  try {
    expect(await AccountAuth.getConnectedAccounts()).toEqual([{ id: 'openrouter', name: 'OpenRouter', provider: 'OpenRouter' }])
    await AccountAuth.disconnectConnectedAccount('openrouter')
    expect(await AccountAuth.getConnectedAccounts()).toEqual([])
    expect(fetchMock.mock.calls.map(([input]) => (input instanceof URL ? input.pathname : String(input)))).toEqual([
      '/account/connections',
      '/account/connections/openrouter/disconnect',
      '/account/connections',
    ])
  } finally {
    fetchMock.mockRestore()
  }
})

test('in-flight refresh returns the selected identity and deduplicates overlapping refreshes', async () => {
  const sessions = ['A', 'B'].map((id) => ({
    backendUrl,
    id: `${backendUrl}/${id}`,
    profile: { displayName: `User ${id}`, email: '', id, provider: 'LVCE Editor' },
    session: {
      authAccessToken: `access-${id}`,
      authClientId: 'client',
      authErrorMessage: '',
      authRefreshToken: `refresh-${id}`,
      userState: 'loggedIn',
    },
  }))
  const { setPersistentAuthValue } = await import('../src/parts/PersistentAuthValue/PersistentAuthValue.ts')
  await setPersistentAuthValue('accountSessions', JSON.stringify({ accounts: sessions, activeId: `${backendUrl}/A`, revision: 0 }))
  const { promise: started, resolve: signalStarted } = Promise.withResolvers<void>()
  const { promise: gate, resolve: release } = Promise.withResolvers<void>()
  const tokens: string[] = []
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(async (...args: readonly unknown[]): Promise<Response> => {
    const options = args[1] as { readonly body: URLSearchParams }
    const token = options.body.get('refresh_token') || ''
    tokens.push(token)
    if (token === 'refresh-A') {
      signalStarted()
      await gate
    }
    return Response.json({ access_token: `${token}-access2`, expires_in: 3600, refresh_token: `${token}-rotated`, token_type: 'bearer' })
  })
  try {
    const first = AccountAuth.getAccessToken({ refresh: 'if-needed' })
    await started
    const second = AccountAuth.getAccessToken({ refresh: 'if-needed' })
    await AccountAuth.useAccount(`${backendUrl}/B`)
    release()
    expect(await Promise.all([first, second])).toEqual(['refresh-B-access2', 'refresh-B-access2'])
    expect(tokens.filter((token) => token === 'refresh-A')).toHaveLength(1)
    expect(tokens.filter((token) => token === 'refresh-B')).toHaveLength(1)
    const registry = JSON.parse(await getPersistentAuthValue('accountSessions'))
    expect(registry.activeId).toBe(`${backendUrl}/B`)
    expect(registry.accounts[0].session.authRefreshToken).toBe('refresh-A-rotated')
    expect(registry.accounts[1].session.authRefreshToken).toBe('refresh-B-rotated')
  } finally {
    release()
    fetchMock.mockRestore()
  }
})
