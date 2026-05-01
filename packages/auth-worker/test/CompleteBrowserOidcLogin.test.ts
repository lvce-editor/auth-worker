import { expect, test } from '@jest/globals'
import { completeBrowserOidcLogin } from '../src/parts/CompleteBrowserOidcLogin/CompleteBrowserOidcLogin.ts'
<<<<<<< HEAD
import {
  clearOidcCallbackUrl,
  clearPendingOidcAuthState,
  saveOidcCallbackUrl,
  savePendingOidcAuthState,
} from '../src/parts/OidcAuthState/OidcAuthState.ts'
=======
import { clearPendingOidcAuthState, savePendingOidcAuthState } from '../src/parts/OidcAuthState/OidcAuthState.ts'
>>>>>>> origin/main

const getRequestUrl = (input: unknown): string => {
  if (typeof input === 'string') {
    return input
  }
  if (input instanceof URL) {
    return input.toString()
  }
  if (input instanceof Request) {
    return input.url
  }
  return ''
}

<<<<<<< HEAD
test('completeBrowserOidcLogin exchanges the callback code from stored callback url and returns the logged in state', async () => {
  await savePendingOidcAuthState({
    clientId: 'lvce-editor-web',
    codeVerifier: 'verifier-1',
    redirectUri: 'https://client.test/auth/callback',
    state: 'state-1',
  })
  await saveOidcCallbackUrl('https://client.test/auth/callback?code=code-1&state=state-1')
=======
test('completeBrowserOidcLogin exchanges the callback code and returns the logged in state', async () => {
  await savePendingOidcAuthState({
    clientId: 'lvce-editor-web',
    codeVerifier: 'verifier-1',
    redirectUri: 'https://client.test/',
    state: 'state-1',
  })
>>>>>>> origin/main

  const originalFetch = globalThis.fetch
  globalThis.fetch = async (...args: readonly unknown[]): Promise<Response> => {
    const url = getRequestUrl(args[0])
    if (url === 'https://client.test/account/me') {
      return Response.json({ displayName: 'Test User' })
    }
    return Response.json({
      access_token: 'oidc-access-token-1',
      refresh_token: 'oidc-refresh-token-1',
      token_type: 'bearer',
    })
  }

  try {
<<<<<<< HEAD
    const result = await completeBrowserOidcLogin('https://client.test/')
=======
    const result = await completeBrowserOidcLogin('https://client.test/', async () => 'https://client.test/?code=code-1&state=state-1')
>>>>>>> origin/main

    expect(result).toEqual({
      authAccessToken: 'oidc-access-token-1',
      authClientId: 'lvce-editor-web',
      authErrorMessage: '',
      authRefreshToken: 'oidc-refresh-token-1',
      userName: 'Test User',
      userState: 'loggedIn',
    })
  } finally {
    globalThis.fetch = originalFetch
<<<<<<< HEAD
    await clearOidcCallbackUrl()
=======
>>>>>>> origin/main
    await clearPendingOidcAuthState()
  }
})
