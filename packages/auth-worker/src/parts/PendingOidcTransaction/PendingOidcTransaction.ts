import { clearPersistentAuthValue, getPersistentAuthValue, setPersistentAuthValue } from '../PersistentAuthValue/PersistentAuthValue.ts'

const storageKey = 'pendingOidcTransaction'

export interface PendingOidcTransaction {
  readonly backendUrl: string
  readonly codeVerifier: string
  readonly redirectUri: string
  readonly state: string
}

const parsePendingOidcTransaction = (value: string): PendingOidcTransaction | undefined => {
  if (!value) {
    return undefined
  }
  try {
    const parsed = JSON.parse(value) as PendingOidcTransaction
    if (
      typeof parsed.backendUrl !== 'string' ||
      typeof parsed.codeVerifier !== 'string' ||
      typeof parsed.redirectUri !== 'string' ||
      typeof parsed.state !== 'string'
    ) {
      return undefined
    }
    return parsed
  } catch {
    return undefined
  }
}

export const getPendingOidcTransaction = async (): Promise<PendingOidcTransaction | undefined> => {
  return parsePendingOidcTransaction(await getPersistentAuthValue(storageKey))
}

export const setPendingOidcTransaction = async (value: PendingOidcTransaction): Promise<void> => {
  await setPersistentAuthValue(storageKey, JSON.stringify(value))
}

export const clearPendingOidcTransaction = async (): Promise<void> => {
  await clearPersistentAuthValue(storageKey)
}
