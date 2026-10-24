import { expect, jest, test } from '@jest/globals'
import { setAuthBackendUrl } from '../src/parts/AuthBackendUrl/AuthBackendUrl.ts'
import {
  getCloudflareConnectionsUrl,
  approveCloudflareMachine,
  getCloudflareStatus,
} from '../src/parts/CloudflareConnections/CloudflareConnections.ts'

test('account connection page uses the configured backend origin', () => {
  setAuthBackendUrl('https://backend.example')
  expect(getCloudflareConnectionsUrl()).toBe('https://backend.example/cloudflare')
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
  setAuthBackendUrl('https://backend.example')
  await expect(getCloudflareStatus()).rejects.toThrow('Sign in to LVCE')
})
