import { afterEach, expect, jest, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
import { RendererWorker } from '@lvce-editor/rpc-registry'
import { setAuthPlatform } from '../src/parts/AuthPlatform/AuthPlatform.ts'
import { getCloudflareStatus, approveCloudflareMachine } from '../src/parts/CloudflareConnections/CloudflareConnections.ts'
import { setPersistentAuthValue } from '../src/parts/PersistentAuthValue/PersistentAuthValue.ts'
const backendUrl = 'https://backend.example'
afterEach(() => {
  jest.restoreAllMocks()
})
const signIn = async (): Promise<void> => {
  setAuthPlatform(PlatformType.Web)
  await setPersistentAuthValue(
    'accountSessions',
    JSON.stringify({
      accounts: [
        {
          backendUrl,
          id: `${backendUrl}/A`,
          profile: { displayName: 'User A', email: '', id: 'A', provider: 'LVCE Editor' },
          session: { authAccessToken: 'lvce-token', authErrorMessage: '', userState: 'loggedIn' },
        },
      ],
      activeId: `${backendUrl}/A`,
      revision: 0,
    }),
  )
}
test('posts machine approval with the active LVCE token and no provider credentials', async () => {
  using mockRendererWorkerRpc = RendererWorker.registerMockRpc({
    'Layout.getBackendUrl'(): string {
      return backendUrl
    },
  })
  expect(mockRendererWorkerRpc).toBeDefined()
  await signIn()
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ approved: true }))
  await expect(approveCloudflareMachine('a'.repeat(32), 'ABCDEF12', 'b'.repeat(32))).resolves.toEqual({ approved: true })
  const [url, options] = fetchMock.mock.calls[0]
  expect(url instanceof URL ? url.href : url).toBe(`https://backend.example/cloudflare/setup/${'a'.repeat(32)}/approve`)
  expect(options?.headers).toEqual({ Accept: 'application/json', Authorization: 'Bearer lvce-token', 'Content-Type': 'application/json' })
  expect(options?.body).toBe(JSON.stringify({ code: 'ABCDEF12', zoneId: 'b'.repeat(32) }))
  expect(options?.redirect).toBe('error')
})
test('redacts backend error responses', async () => {
  using mockRendererWorkerRpc = RendererWorker.registerMockRpc({
    'Layout.getBackendUrl'(): string {
      return backendUrl
    },
  })
  expect(mockRendererWorkerRpc).toBeDefined()
  await signIn()
  jest.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ error: 'provider-secret' }, { status: 503 }))
  await expect(getCloudflareStatus()).rejects.toThrow('request failed (503)')
})

test('does not send an account token after the renderer backend changes', async () => {
  await signIn()
  let lookupCount = 0
  using mockRendererWorkerRpc = RendererWorker.registerMockRpc({
    'Layout.getBackendUrl'(): string {
      lookupCount++
      return lookupCount === 1 ? backendUrl : 'https://other-backend.example'
    },
  })
  expect(mockRendererWorkerRpc).toBeDefined()
  const fetchMock = jest.spyOn(globalThis, 'fetch')
  await expect(getCloudflareStatus()).rejects.toThrow('Account backend changed')
  expect(fetchMock).not.toHaveBeenCalled()
})
