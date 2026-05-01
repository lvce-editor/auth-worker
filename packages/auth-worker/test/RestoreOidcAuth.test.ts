import { expect, test } from '@jest/globals'
import { saveOidcClientId } from '../src/parts/OidcAuthState/OidcAuthState.ts'
import { setPersistentAuthValue } from '../src/parts/PersistentAuthValue/PersistentAuthValue.ts'
import { restoreOidcAuth } from '../src/parts/RestoreOidcAuth/RestoreOidcAuth.ts'

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
test('restoreOidcAuth refreshes the stored oidc tokens and returns the user name', async () => {
=======
test('restoreOidcAuth refreshes stored oidc tokens and resolves the user name', async () => {
>>>>>>> origin/main
  await saveOidcClientId('lvce-editor-web')
  await setPersistentAuthValue('refreshToken', 'stored-refresh-token-1')

  const originalFetch = globalThis.fetch
  globalThis.fetch = async (...args: readonly unknown[]): Promise<Response> => {
    const url = getRequestUrl(args[0])
    if (url === 'https://client.test/account/me') {
      return Response.json({ displayName: 'Test User' })
    }
    return Response.json({
      access_token: 'oidc-access-token-2',
      refresh_token: 'oidc-refresh-token-2',
      token_type: 'bearer',
    })
  }

  try {
    const result = await restoreOidcAuth('https://client.test/')

    expect(result).toEqual({
      authAccessToken: 'oidc-access-token-2',
      authClientId: 'lvce-editor-web',
      authErrorMessage: '',
      authRefreshToken: 'oidc-refresh-token-2',
      userName: 'Test User',
      userState: 'loggedIn',
    })
  } finally {
    globalThis.fetch = originalFetch
<<<<<<< HEAD
    await setPersistentAuthValue('accessToken', '')
    await setPersistentAuthValue('refreshToken', '')
=======
    await setPersistentAuthValue('refreshToken', '')
    await setPersistentAuthValue('accessToken', '')
>>>>>>> origin/main
  }
})
