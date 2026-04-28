import { expect, test } from '@jest/globals'
import { getElectronRedirectUri } from '../src/parts/GetElectronRedirectUri/GetElectronRedirectUri.ts'
import { errorHtml, successHtml } from '../src/parts/OAuthCallbackHtml/OAuthCallbackHtml.ts'

test.skip('getElectronRedirectUri uses configured auth callback html for electron oauth server', async () => {
  const invocations: string[][] = []

  const result = await getElectronRedirectUri(7)

  expect(result).toBe('http://localhost:3210')
  expect(invocations).toEqual([['OAuthServer.create', '7', successHtml, errorHtml]])
})
