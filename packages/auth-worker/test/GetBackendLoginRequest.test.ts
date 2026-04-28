// cspell:ignore pkce

import { afterEach, expect, jest, test } from '@jest/globals'
import { AuthProcess } from '@lvce-editor/rpc-registry'
import * as CreatePkceValues from '../src/parts/CreatePkceValues/CreatePkceValues.ts'
import { getBackendLoginRequest } from '../src/parts/GetBackendLoginRequest/GetBackendLoginRequest.ts'
import { getElectronRedirectUri } from '../src/parts/GetElectronRedirectUri/GetElectronRedirectUri.ts'
import { errorHtml, successHtml } from '../src/parts/OAuthCallbackHtml/OAuthCallbackHtml.ts'

afterEach(() => {
  jest.restoreAllMocks()
})

test('getBackendLoginRequest creates an oidc authorize url with pkce parameters', async () => {
  const mockCreatePkceValues = jest.spyOn(CreatePkceValues, 'createPkceValues').mockResolvedValue({
    codeChallenge: 'challenge-1',
    codeVerifier: 'verifier-1',
  })
  const originalCrypto = globalThis.crypto
  const mockCrypto = {
    randomUUID: jest.fn(() => 'uuid-1'),
  } as unknown as Crypto
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: mockCrypto,
  })

  try {
    const result = await getBackendLoginRequest('https://api.example.com/', 0, 1, 'http://localhost:43123/callback')

    expect(result.codeVerifier).toBe('verifier-1')
    expect(result.redirectUri).toBe('http://localhost:43123/callback')
    expect(result.loginUrl).toBe(
      'https://api.example.com/oidc/auth?client_id=lvce-editor-native&code_challenge=challenge-1&code_challenge_method=S256&nonce=uuid-1&prompt=consent&response_type=code&scope=openid+offline_access+profile+email&state=uuid-1&redirect_uri=http%3A%2F%2Flocalhost%3A43123%2Fcallback',
    )
    expect(mockCreatePkceValues).toHaveBeenCalledTimes(1)
  } finally {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    })
  }
})

test('getElectronRedirectUri uses configured auth callback html for electron oauth server', async () => {
  const mockInvoke = jest.spyOn(AuthProcess, 'invoke').mockResolvedValue('3210' as never)

  const result = await getElectronRedirectUri(7)

  expect(result).toBe('http://localhost:3210/callback')
  expect(mockInvoke).toHaveBeenCalledWith('OAuthServer.create', '7', successHtml, errorHtml)
})
