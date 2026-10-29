import { PlatformType } from '@lvce-editor/constants'
import { openDB, type IDBPDatabase } from 'idb'
import { getAuthPlatform } from '../AuthPlatform/AuthPlatform.ts'
import * as SecretStorage from '../SecretStorage/SecretStorage.ts'

const databaseName = 'auth-worker'
const objectStoreName = 'auth'

const memoryStorage = new Map<string, string>()
const secretKeys = new Set(['accessToken', 'refreshToken', 'accountSessions'])

interface PersistentAuthState {
  databasePromise: Promise<IDBPDatabase | undefined> | undefined
}

const state: PersistentAuthState = {
  databasePromise: undefined,
}

const getDatabase = async (): Promise<IDBPDatabase | undefined> => {
  if (typeof indexedDB === 'undefined') {
    return undefined
  }
  if (!state.databasePromise) {
    state.databasePromise = openDB(databaseName, 1, {
      // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
      upgrade(database) {
        if (!database.objectStoreNames.contains(objectStoreName)) {
          database.createObjectStore(objectStoreName)
        }
      },
    })
  }
  return state.databasePromise
}

const getIndexedDbValue = async (key: string): Promise<string> => {
  const database = await getDatabase()
  if (!database) {
    return memoryStorage.get(key) ?? ''
  }
  const value = await database.get(objectStoreName, key)
  return typeof value === 'string' ? value : ''
}

const setIndexedDbValue = async (key: string, value: string): Promise<void> => {
  memoryStorage.set(key, value)
  const database = await getDatabase()
  if (!database) {
    return
  }
  await database.put(objectStoreName, value, key)
}

const clearIndexedDbValue = async (key: string): Promise<void> => {
  memoryStorage.delete(key)
  const database = await getDatabase()
  if (!database) {
    return
  }
  await database.delete(objectStoreName, key)
}

const shouldUseSecretStorage = (key: string): boolean => {
  return getAuthPlatform() === PlatformType.Electron && secretKeys.has(key)
}

export const getPersistentAuthValue = async (key: string): Promise<string> => {
  if (!shouldUseSecretStorage(key)) {
    return getIndexedDbValue(key)
  }
  return (await SecretStorage.getSecret(key)) || ''
}

export const setPersistentAuthValue = async (key: string, value: string): Promise<void> => {
  if (!shouldUseSecretStorage(key)) {
    await setIndexedDbValue(key, value)
    return
  }
  if (value) {
    await SecretStorage.storeSecret(key, value)
  } else {
    await SecretStorage.deleteSecret(key)
  }
  await clearIndexedDbValue(key)
}

export const clearPersistentAuthValue = async (key: string): Promise<void> => {
  if (shouldUseSecretStorage(key)) {
    await Promise.all([SecretStorage.deleteSecret(key), clearIndexedDbValue(key)])
    return
  }
  await clearIndexedDbValue(key)
}
