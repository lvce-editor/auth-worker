import { expect, test } from '@jest/globals'
import { getAccountProfile } from '../src/parts/GetAccountProfile/GetAccountProfile.ts'

test('loads stable identity with the selected bearer token and exposes supported profile metadata', async () => {
  const calls: unknown[] = []
  const fetchFn: typeof fetch = async (...args: readonly unknown[]) => {
    calls.push(args)
    return Response.json({
      avatarUrl: 'https://avatars.githubusercontent.com/u/1',
      displayName: 'User A',
      email: 'a@test',
      id: 'A',
      provider: 'github',
      secret: 'hidden',
    })
  }
  expect(await getAccountProfile('https://backend.test', 'token-A', fetchFn)).toEqual({
    avatarUrl: 'https://avatars.githubusercontent.com/u/1',
    displayName: 'User A',
    email: 'a@test',
    id: 'A',
    provider: 'github',
  })
  expect(calls).toEqual([[new URL('https://backend.test/account/me'), { headers: { Accept: 'application/json', Authorization: 'Bearer token-A' } }]])
})

test('omits an unavailable avatar URL', async () => {
  await expect(getAccountProfile('https://backend.test', 'token', async () => Response.json({ displayName: 'User A', id: 'A' }))).resolves.toEqual({
    displayName: 'User A',
    email: '',
    id: 'A',
    provider: 'LVCE Editor',
  })
})

test('rejects missing stable identity rather than deduplicating by name', async () => {
  await expect(getAccountProfile('https://backend.test', 'token', async () => Response.json({ displayName: 'Name' }))).rejects.toThrow(
    'account identity',
  )
})
