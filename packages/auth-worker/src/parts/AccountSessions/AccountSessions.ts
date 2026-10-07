import type { LoginResult } from '../HandleClickLoginTypes/HandleClickLoginTypes.ts'

export interface AccountProfile {
  readonly displayName: string
  readonly email: string
  readonly id: string
  readonly provider: string
}

export interface AccountSession {
  readonly backendUrl: string
  readonly id: string
  readonly profile: AccountProfile
  readonly session: LoginResult
}

export interface AccountRegistry {
  readonly accounts: readonly AccountSession[]
  readonly activeId: string
  readonly revision: number
}

export interface AccountStorage {
  readonly read: () => Promise<string>
  readonly write: (value: string) => Promise<void>
}

export interface AccountSessions {
  readonly add: (account: AccountSession, revision: number) => Promise<void>
  readonly read: () => Promise<AccountRegistry>
  readonly remove: (id: string) => Promise<void>
  readonly select: (id: string) => Promise<void>
  readonly update: (account: AccountSession, session: LoginResult) => Promise<void>
}

// One auth worker owns the registry. Serialize its storage transactions, not network requests.
export const createAccountSessions = (storage: AccountStorage): AccountSessions => {
  const state = { tail: Promise.resolve() }
  const transact = <T>(operation: (registry: AccountRegistry) => Promise<T>): Promise<T> => {
    const previous = state.tail
    const result = (async (): Promise<T> => {
      await previous
      const value = await storage.read()
      const registry: AccountRegistry = value ? JSON.parse(value) : { accounts: [], activeId: '', revision: 0 }
      return operation(registry)
    })()
    state.tail = (async (): Promise<void> => {
      try {
        await result
      } catch {
        // A rejected transaction must not block subsequent requests.
      }
    })()
    return result
  }
  const save = async (registry: AccountRegistry): Promise<void> => storage.write(JSON.stringify(registry))
  const read = (): Promise<AccountRegistry> => transact(async (registry) => registry)
  const add = (account: AccountSession, revision: number): Promise<void> =>
    transact(async (registry) => {
      const accounts = [...registry.accounts.filter((item) => item.id !== account.id), account]
      const activeId = registry.revision === revision || !registry.activeId ? account.id : registry.activeId
      await save({ accounts, activeId, revision: registry.revision + 1 })
    })
  const select = (id: string): Promise<void> =>
    transact(async (registry) => {
      if (registry.accounts.every((account) => account.id !== id)) {
        throw new Error('Account is no longer available.')
      }
      await save({ ...registry, activeId: id, revision: registry.revision + 1 })
    })
  const remove = (id: string): Promise<void> =>
    transact(async (registry) => {
      const accounts = registry.accounts.filter((account) => account.id !== id)
      const activeId = registry.activeId === id ? accounts[0]?.id || '' : registry.activeId
      await save({ accounts, activeId, revision: registry.revision + 1 })
    })
  const update = (account: AccountSession, session: LoginResult): Promise<void> =>
    transact(async (registry) => {
      // A logout or another login for this identity invalidates an old refresh result.
      const accounts = registry.accounts.map((item) =>
        item.id === account.id && item.session.authRefreshToken === account.session.authRefreshToken ? { ...item, session } : item,
      )
      await save({ ...registry, accounts })
    })
  return { add, read, remove, select, update }
}
