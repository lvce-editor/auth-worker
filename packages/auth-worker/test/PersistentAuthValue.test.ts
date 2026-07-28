import type { DisposableMockRpc } from '@lvce-editor/rpc-registry'
import { afterEach, expect, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
import { SharedProcess } from '@lvce-editor/rpc-registry'
import { setAuthPlatform } from '../src/parts/AuthPlatform/AuthPlatform.ts'
import { clearPersistentAuthValue, getPersistentAuthValue, setPersistentAuthValue } from '../src/parts/PersistentAuthValue/PersistentAuthValue.ts'

const state: { sharedProcess: DisposableMockRpc | undefined } = {
  sharedProcess: undefined,
}

afterEach(async () => {
  state.sharedProcess?.[Symbol.dispose]()
  state.sharedProcess = undefined
  setAuthPlatform(PlatformType.Web)
  await Promise.all([clearPersistentAuthValue('accessToken'), clearPersistentAuthValue('refreshToken'), clearPersistentAuthValue('userName')])
})

test('electron stores, reads, and deletes tokens with secret storage', async () => {
  setAuthPlatform(PlatformType.Electron)
  state.sharedProcess = SharedProcess.registerMockRpc({
    'SecretStorage.delete'() {},
    'SecretStorage.get'() {
      return 'stored-token'
    },
    'SecretStorage.store'() {},
  })

  await setPersistentAuthValue('accessToken', 'new-token')
  await expect(getPersistentAuthValue('accessToken')).resolves.toBe('stored-token')
  await clearPersistentAuthValue('accessToken')

  expect(state.sharedProcess.invocations).toEqual([
    ['SecretStorage.store', 'lvce-editor.auth', 'accessToken', 'new-token'],
    ['SecretStorage.get', 'lvce-editor.auth', 'accessToken'],
    ['SecretStorage.delete', 'lvce-editor.auth', 'accessToken'],
  ])
})

test('electron migrates legacy tokens from indexed db to secret storage', async () => {
  setAuthPlatform(PlatformType.Web)
  await setPersistentAuthValue('refreshToken', 'legacy-token')
  setAuthPlatform(PlatformType.Electron)
  state.sharedProcess = SharedProcess.registerMockRpc({
    'SecretStorage.get'() {},
    'SecretStorage.store'() {},
  })

  await expect(getPersistentAuthValue('refreshToken')).resolves.toBe('legacy-token')

  expect(state.sharedProcess.invocations).toEqual([
    ['SecretStorage.get', 'lvce-editor.auth', 'refreshToken'],
    ['SecretStorage.store', 'lvce-editor.auth', 'refreshToken', 'legacy-token'],
  ])
  setAuthPlatform(PlatformType.Web)
  await expect(getPersistentAuthValue('refreshToken')).resolves.toBe('')
})

test('electron keeps non-secret auth values in indexed db', async () => {
  setAuthPlatform(PlatformType.Electron)
  state.sharedProcess = SharedProcess.registerMockRpc({})

  await setPersistentAuthValue('userName', 'Test User')
  await expect(getPersistentAuthValue('userName')).resolves.toBe('Test User')
  await clearPersistentAuthValue('userName')

  expect(state.sharedProcess.invocations).toEqual([])
})
