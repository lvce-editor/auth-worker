// cspell:ignore pkce

import { expect, test } from '@jest/globals'
import * as oauth from 'oauth4webapi'

const { createPkceValues } = await import('../src/parts/CreatePkceValues/CreatePkceValues.ts')

test('createPkceValues returns oauth-compatible pkce values', async () => {
  const result = await createPkceValues()

  expect(result).toEqual({
    codeChallenge: await oauth.calculatePKCECodeChallenge(result.codeVerifier),
    codeVerifier: expect.any(String),
    nonce: expect.any(String),
  })
  expect(result.codeVerifier).toHaveLength(43)
  expect(result.nonce).toHaveLength(43)
})
