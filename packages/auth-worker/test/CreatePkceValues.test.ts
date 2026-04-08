// cspell:ignore pkce

import { expect, test } from '@jest/globals'
import * as oauth from 'oauth4webapi'

const { createPkceValues } = await import('../src/parts/CreatePkceValues/CreatePkceValues.ts')

test('createPkceValues returns oauth-compatible pkce values', async () => {
  const result = await createPkceValues()

  expect(result.codeChallenge).toBe(await oauth.calculatePKCECodeChallenge(result.codeVerifier))
  expect(result.codeVerifier).toHaveLength(43)
  expect(result.nonce).toMatch(/^[A-Za-z0-9_-]{43}$/)
  expect(result.state).toMatch(/^[A-Za-z0-9_-]{43}$/)
})
