import { expect, test } from '@jest/globals'
const { getElectronRedirectUri } = await import('../src/parts/GetBackendLoginRequest/GetBackendLoginRequest.ts')
const { errorHtml, successHtml } = await import('../src/parts/OAuthCallbackHtml/OAuthCallbackHtml.ts')

test('getElectronRedirectUri uses configured auth callback html for electron oauth server', async () => {
  const invocations: string[][] = []
  const invoke = async (method: string, ...params: readonly string[]): Promise<number> => {
    invocations.push([method, ...params])
    return 3210
  }

  const result = await getElectronRedirectUri(7, invoke)

  expect(result).toBe('http://localhost:3210')
  expect(invocations).toEqual([['OAuthServer.create', '7', successHtml, errorHtml]])
})
