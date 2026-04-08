import { clearPersistentAuthValue, getPersistentAuthValue, setPersistentAuthValue } from '../PersistentAuthValue/PersistentAuthValue.ts'

const storageKey = 'authError'

export const getStoredAuthError = async (): Promise<string> => {
  return getPersistentAuthValue(storageKey)
}

export const setStoredAuthError = async (value: string): Promise<void> => {
  await setPersistentAuthValue(storageKey, value)
}

export const clearStoredAuthError = async (): Promise<void> => {
  await clearPersistentAuthValue(storageKey)
}

export const consumeStoredAuthError = async (): Promise<string> => {
  const value = await getStoredAuthError()
  if (value) {
    await clearStoredAuthError()
  }
  return value
}
