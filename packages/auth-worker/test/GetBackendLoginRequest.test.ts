// cspell:ignore pkce

import { expect, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
const { getBackendLoginRequest, getElectronRedirectUri } = await import('../src/parts/GetBackendLoginRequest/GetBackendLoginRequest.ts')
const { oidcClientId, oidcScope } = await import('../src/parts/OidcConfig/OidcConfig.ts')
const { errorHtml, successHtml } = await import('../src/parts/OAuthCallbackHtml/OAuthCallbackHtml.ts')

test('getElectronRedirectUri uses configured auth callback html for electron oauth server', async () => {
  const invocations: string[][] = []
  const invoke = async (method: string, ...params: readonly string[]): Promise<number> => {
    invocations.push([method, ...params])
    return 3210
  }

  const result = await getElectronRedirectUri(7, invoke)

  expect(result).toBe('http://127.0.0.1:3210/callback')
  expect(invocations).toEqual([['OAuthServer.create', '7', successHtml, errorHtml]])
})

test('getBackendLoginRequest builds electron oidc authorize request with pkce values', async () => {
  const result = await getBackendLoginRequest('https://backend.example', PlatformType.Electron, 0, 'http://127.0.0.1:3210/callback')

  expect(result.redirectUri).toBe('http://127.0.0.1:3210/callback')
  expect(result.codeVerifier.length).toBeGreaterThan(10)

  const loginUrl = new URL(result.loginUrl)
  expect(loginUrl.origin).toBe('https://backend.example')
  expect(loginUrl.pathname).toBe('/oidc/auth')
  expect(loginUrl.searchParams.get('client_id')).toBe(oidcClientId)
  expect(loginUrl.searchParams.get('code_challenge')).toBeTruthy()
  expect(loginUrl.searchParams.get('code_challenge')).not.toBe(result.codeVerifier)
  expect(loginUrl.searchParams.get('code_challenge_method')).toBe('S256')
  expect(loginUrl.searchParams.get('nonce')).toBeTruthy()
  expect(loginUrl.searchParams.get('redirect_uri')).toBe('http://127.0.0.1:3210/callback')
  expect(loginUrl.searchParams.get('response_type')).toBe('code')
  expect(loginUrl.searchParams.get('scope')).toBe(oidcScope)
  expect(loginUrl.searchParams.has('state')).toBe(false)
})

test('getBackendLoginRequest builds web oidc authorize request with pkce values', async () => {
  const result = await getBackendLoginRequest('https://backend.example', 0, 0, 'https://app.example/callback')

  expect(result.redirectUri).toBe('https://app.example/callback')
  expect(result.codeVerifier.length).toBeGreaterThan(10)

  const loginUrl = new URL(result.loginUrl)
  expect(loginUrl.origin).toBe('https://backend.example')
  expect(loginUrl.pathname).toBe('/oidc/auth')
  expect(loginUrl.searchParams.get('client_id')).toBe(oidcClientId)
  expect(loginUrl.searchParams.get('code_challenge')).toBeTruthy()
  expect(loginUrl.searchParams.get('code_challenge')).not.toBe(result.codeVerifier)
  expect(loginUrl.searchParams.get('code_challenge_method')).toBe('S256')
  expect(loginUrl.searchParams.get('nonce')).toBeTruthy()
  expect(loginUrl.searchParams.get('redirect_uri')).toBe('https://app.example/callback')
  expect(loginUrl.searchParams.get('response_type')).toBe('code')
  expect(loginUrl.searchParams.get('scope')).toBe(oidcScope)
  expect(loginUrl.searchParams.has('state')).toBe(false)
})
