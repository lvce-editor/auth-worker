// cspell:ignore pkce

import { expect, test } from '@jest/globals'
import { getBackendLoginRequest } from '../src/parts/GetBackendLoginRequest/GetBackendLoginRequest.ts'

test('getBackendLoginRequest creates an oidc authorize url with pkce parameters', async () => {
  const result = await getBackendLoginRequest(
    'https://api.example.com/',
    0,
    1,
    'http://localhost:43123/callback',
    async () => ({
      codeChallenge: 'challenge-1',
      codeVerifier: 'verifier-1',
    }),
    () => 'uuid-1',
  )

  expect(result.codeVerifier).toBe('verifier-1')
  expect(result.nonce).toBe('uuid-1')
  expect(result.redirectUri).toBe('http://localhost:43123/callback')
  expect(result.loginUrl).toBe(
    'https://api.example.com/oidc/auth?client_id=lvce-editor-native&code_challenge=challenge-1&code_challenge_method=S256&nonce=uuid-1&prompt=consent&response_type=code&scope=openid+offline_access+profile+email&state=uuid-1&redirect_uri=http%3A%2F%2Flocalhost%3A43123%2Fcallback',
  )
})
