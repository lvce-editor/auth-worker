import { afterEach, expect, test } from '@jest/globals'
import { getAccessToken } from '../src/parts/GetAccessToken/GetAccessToken.ts'
import { clearPersistentAuthValue, setPersistentAuthValue } from '../src/parts/PersistentAuthValue/PersistentAuthValue.ts'

afterEach(async () => {
  await clearPersistentAuthValue('accessToken')
})

test('returns the persisted access token', async () => {
  await setPersistentAuthValue('accessToken', 'token-1')

  await expect(getAccessToken()).resolves.toBe('token-1')
})

test('returns an empty string when no access token is persisted', async () => {
  await expect(getAccessToken()).resolves.toBe('')
})
