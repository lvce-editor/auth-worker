import { afterEach, expect, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
import { MainProcess } from '@lvce-editor/rpc-registry'
import { setAuthPlatform } from '../src/parts/AuthPlatform/AuthPlatform.ts'
import { handleClickLogin } from '../src/parts/HandleClickLogin/HandleClickLogin.ts'
import { logout } from '../src/parts/Logout/Logout.ts'
import * as MockBackendAuth from '../src/parts/MockBackendAuth/MockBackendAuth.ts'
import { clearPersistedAuthSession } from '../src/parts/PersistedAuthSession/PersistedAuthSession.ts'

afterEach(async () => {
  MockBackendAuth.clear()
  setAuthPlatform(PlatformType.Web)
  await clearPersistedAuthSession()
})

test('electron login stores access and refresh tokens with secret storage', async () => {
  using mockMainProcessRpc = MainProcess.registerMockRpc({
    'SecretStorage.store'() {},
  })
  MockBackendAuth.setNextLoginResponse({
    delay: 0,
    response: {
      accessToken: 'access-token-1',
      refreshToken: 'refresh-token-1',
    },
    type: 'success',
  })

  await expect(
    handleClickLogin({
      backendUrl: 'https://api.example.com',
      platform: PlatformType.Electron,
    }),
  ).resolves.toMatchObject({
    authAccessToken: 'access-token-1',
    authRefreshToken: 'refresh-token-1',
    userState: 'loggedIn',
  })

  expect(mockMainProcessRpc.invocations).toEqual([
    ['SecretStorage.store', 'lvce-editor.auth', 'accessToken', 'access-token-1'],
    ['SecretStorage.store', 'lvce-editor.auth', 'refreshToken', 'refresh-token-1'],
  ])
})

test('electron logout deletes access and refresh tokens from secret storage', async () => {
  setAuthPlatform(PlatformType.Electron)
  using mockMainProcessRpc = MainProcess.registerMockRpc({
    'SecretStorage.delete'() {},
  })

  await expect(logout({ backendUrl: '' })).resolves.toMatchObject({
    userState: 'loggedOut',
  })

  expect(mockMainProcessRpc.invocations).toEqual([
    ['SecretStorage.delete', 'lvce-editor.auth', 'accessToken'],
    ['SecretStorage.delete', 'lvce-editor.auth', 'refreshToken'],
  ])
})
