import { expect, jest, test } from '@jest/globals'
import { saveOidcClientId } from '../src/parts/OidcAuthState/OidcAuthState.ts'
import { setPersistentAuthValue } from '../src/parts/PersistentAuthValue/PersistentAuthValue.ts'
import { restoreOidcAuth } from '../src/parts/RestoreOidcAuth/RestoreOidcAuth.ts'

const getRequestUrl = (input: unknown): string => {
  if (typeof input === 'string') {
    return input
  }
  if (input instanceof URL) {
    return input.href
  }
  if (input instanceof Request) {
    return input.url
  }
  return ''
}

test('restoreOidcAuth refreshes the stored oidc tokens and returns the user name', async () => {
  await saveOidcClientId('lvce-editor-web')
  await setPersistentAuthValue('refreshToken', 'stored-refresh-token-1')

  const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(async (...args: readonly unknown[]): Promise<Response> => {
    const url = getRequestUrl(args[0])
    if (url === 'https://client.test/account/me') {
      return Response.json({ displayName: 'Test User' })
    }
    return Response.json({
      access_token: 'oidc-access-token-2',
      refresh_token: 'oidc-refresh-token-2',
      token_type: 'bearer',
    })
  })

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
    fetchMock.mockRestore()
    await setPersistentAuthValue('accessToken', '')
    await setPersistentAuthValue('refreshToken', '')
  }
})
