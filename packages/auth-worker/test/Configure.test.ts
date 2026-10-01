import { afterEach, expect, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
import { MainProcess } from '@lvce-editor/rpc-registry'
import type { RefreshOidcTokensResult } from '../src/parts/RefreshOidcTokens/RefreshOidcTokens.ts'
import { configure } from '../src/parts/Configure/Configure.ts'
import { getAccessToken } from '../src/parts/GetAccessToken/GetAccessToken.ts'
import { clearStoredOidcClientId, saveOidcClientId } from '../src/parts/OidcAuthState/OidcAuthState.ts'
import { clearPersistentAuthValue, setPersistentAuthValue } from '../src/parts/PersistentAuthValue/PersistentAuthValue.ts'

afterEach(async () => {
  configure({ backendUrl: '', platform: PlatformType.Web })
  await clearStoredOidcClientId()
  await clearPersistentAuthValue('accessTokenExpiresAt')
})

test('configures lazy token access to refresh an Electron secret without restoring a session', async () => {
  using mockMainProcessRpc = MainProcess.registerMockRpc({
    'SecretStorage.get'(_storageId: string, key: string): string {
      return key === 'accessToken' ? 'expired-secret' : 'refresh-secret'
    },
    'SecretStorage.store'() {},
  })
  configure({ backendUrl: 'https://api.example.com', platform: PlatformType.Electron })
  expect(mockMainProcessRpc.invocations).toEqual([])
  await Promise.all([saveOidcClientId('client'), setPersistentAuthValue('accessTokenExpiresAt', '1000')])
  const refreshCalls: Array<readonly [string, string, string]> = []
  const refreshTokens = async (backendUrl: string, clientId: string, refreshToken: string): Promise<RefreshOidcTokensResult> => {
    refreshCalls.push([backendUrl, clientId, refreshToken])
    return { accessToken: 'fresh-secret', expiresIn: 3600, refreshToken: 'rotated-secret' }
  }

  await expect(getAccessToken({ refresh: 'if-needed' }, refreshTokens, 2000)).resolves.toBe('fresh-secret')
  expect(refreshCalls).toEqual([['https://api.example.com', 'client', 'refresh-secret']])
  expect(mockMainProcessRpc.invocations).toEqual([
    ['SecretStorage.get', 'lvce-editor.auth', 'accessToken'],
    ['SecretStorage.get', 'lvce-editor.auth', 'refreshToken'],
    ['SecretStorage.store', 'lvce-editor.auth', 'accessToken', 'fresh-secret'],
    ['SecretStorage.store', 'lvce-editor.auth', 'refreshToken', 'rotated-secret'],
  ])
})
