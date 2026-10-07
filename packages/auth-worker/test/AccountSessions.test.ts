import { expect, test } from '@jest/globals'
import type { AccountSession, AccountStorage } from '../src/parts/AccountSessions/AccountSessions.ts'
import { createAccountSessions } from '../src/parts/AccountSessions/AccountSessions.ts'

const makeAccount = (id: string): AccountSession => ({
  backendUrl: 'https://backend.test',
  id,
  profile: { displayName: 'Same name', email: '', id, provider: 'LVCE Editor' },
  session: { authAccessToken: `access-${id}`, authErrorMessage: '', authRefreshToken: `refresh-${id}`, userState: 'loggedIn' },
})

const createStorage = (): AccountStorage => {
  const state = { value: '' }
  return {
    read: async (): Promise<string> => state.value,
    write: async (value: string): Promise<void> => {
      state.value = value
    },
  }
}

test('retains independent sessions, deduplicates stable identity, and persists selection across restart', async () => {
  const storage = createStorage()
  const accounts = createAccountSessions(storage)
  await accounts.add(makeAccount('A'), 0)
  await accounts.add(makeAccount('B'), 1)
  const snapshot1 = await accounts.read()
  expect(snapshot1.activeId).toBe('B')
  await accounts.select('A')
  const restarted = createAccountSessions(storage)
  const snapshot2 = await restarted.read()
  expect(snapshot2.activeId).toBe('A')
  await restarted.add(makeAccount('A'), 3)
  const snapshot3 = await restarted.read()
  expect(snapshot3.accounts.map((item) => item.id)).toEqual(['B', 'A'])
})

test('late login cannot override an explicit account switch', async () => {
  const accounts = createAccountSessions(createStorage())
  await accounts.add(makeAccount('A'), 0)
  await accounts.add(makeAccount('B'), 1)
  const { revision } = await accounts.read()
  await accounts.select('A')
  await accounts.add(makeAccount('C'), revision)
  const snapshot4 = await accounts.read()
  expect(snapshot4.activeId).toBe('A')
  const snapshot5 = await accounts.read()
  expect(snapshot5.accounts).toHaveLength(3)
})

test('refresh rotation updates its original account after selection changes', async () => {
  const accounts = createAccountSessions(createStorage())
  const a = makeAccount('A')
  await accounts.add(a, 0)
  await accounts.add(makeAccount('B'), 1)
  await accounts.update(a, { ...a.session, authAccessToken: 'rotated-access', authRefreshToken: 'rotated-refresh' })
  const registry = await accounts.read()
  expect(registry.activeId).toBe('B')
  expect(registry.accounts[0].session.authRefreshToken).toBe('rotated-refresh')
  expect(registry.accounts[1].session.authAccessToken).toBe('access-B')
})

test('logout removes only the requested session and late refresh cannot resurrect it', async () => {
  const accounts = createAccountSessions(createStorage())
  const a = makeAccount('A')
  await accounts.add(a, 0)
  await accounts.add(makeAccount('B'), 1)
  await accounts.remove('A')
  await accounts.update(a, { ...a.session, authAccessToken: 'late-access' })
  const snapshot6 = await accounts.read()
  expect(snapshot6.accounts.map((item) => item.id)).toEqual(['B'])
  await accounts.remove('B')
  const snapshot7 = await accounts.read()
  expect(snapshot7).toMatchObject({ accounts: [], activeId: '' })
})

test('late refresh cannot overwrite credentials from a repeated login', async () => {
  const accounts = createAccountSessions(createStorage())
  const a = makeAccount('A')
  await accounts.add(a, 0)
  await accounts.add({ ...a, session: { ...a.session, authRefreshToken: 'new-login-refresh' } }, 1)
  await accounts.update(a, { ...a.session, authRefreshToken: 'old-login-rotation' })
  const snapshot8 = await accounts.read()
  expect(snapshot8.accounts[0].session.authRefreshToken).toBe('new-login-refresh')
})

test('concurrent storage mutations preserve accounts and reject missing selection', async () => {
  const accounts = createAccountSessions(createStorage())
  await Promise.all([accounts.add(makeAccount('A'), 0), accounts.add(makeAccount('B'), 0)])
  const snapshot9 = await accounts.read()
  expect(snapshot9.accounts).toHaveLength(2)
  await expect(accounts.select('missing')).rejects.toThrow('Account is no longer available.')
  await accounts.select('B')
  const snapshot10 = await accounts.read()
  expect(snapshot10.activeId).toBe('B')
})

test('expired accounts remain available for another login without exposing another identity', async () => {
  const accounts = createAccountSessions(createStorage())
  const a = makeAccount('A')
  await accounts.add(a, 0)
  await accounts.update(a, { authErrorMessage: 'Please sign in again.', userState: 'loggedOut' })
  const snapshot11 = await accounts.read()
  expect(snapshot11).toMatchObject({ accounts: [{ session: { userState: 'loggedOut' } }], activeId: 'A' })
})
