import { expect, jest, test } from '@jest/globals'
import { RendererWorker } from '@lvce-editor/rpc-registry'
import {
  getCloudflareConnectionsUrl,
  approveCloudflareMachine,
  getCloudflareStatus,
} from '../src/parts/CloudflareConnections/CloudflareConnections.ts'

test('account connection page uses the current renderer backend origin', async () => {
  using mockRendererWorkerRpc = RendererWorker.registerMockRpc({
    'Layout.getBackendUrl'(): string {
      return 'https://backend.example'
    },
  })
  expect(mockRendererWorkerRpc).toBeDefined()
  await expect(getCloudflareConnectionsUrl()).resolves.toBe('https://backend.example/cloudflare')
})
test('invalid approvals cannot issue authenticated network requests', () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch')
  try {
    expect(() => approveCloudflareMachine('../other', '12345678', 'a'.repeat(32))).toThrow('Invalid Cloudflare')
    expect(() => approveCloudflareMachine('b'.repeat(32), 'secret', 'a'.repeat(32))).toThrow('Invalid Cloudflare')
    expect(fetchMock).not.toHaveBeenCalled()
  } finally {
    fetchMock.mockRestore()
  }
})
test('signed-out users cannot access Cloudflare management', async () => {
  using mockRendererWorkerRpc = RendererWorker.registerMockRpc({
    'Layout.getBackendUrl'(): string {
      return 'https://backend.example'
    },
  })
  expect(mockRendererWorkerRpc).toBeDefined()
  await expect(getCloudflareStatus()).rejects.toThrow('Sign in to LVCE')
})
