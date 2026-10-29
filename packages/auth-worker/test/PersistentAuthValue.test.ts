import { afterEach, beforeAll, expect, test } from '@jest/globals'
import 'fake-indexeddb/auto'
import { PlatformType } from '@lvce-editor/constants'
import { MainProcess } from '@lvce-editor/rpc-registry'
import { setAuthPlatform } from '../src/parts/AuthPlatform/AuthPlatform.ts'
import { clearPersistentAuthValue, getPersistentAuthValue, setPersistentAuthValue } from '../src/parts/PersistentAuthValue/PersistentAuthValue.ts'

const openAuthDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('auth-worker', 1)
    request.addEventListener('upgradeneeded', () => {
      if (!request.result.objectStoreNames.contains('auth')) {
        request.result.createObjectStore('auth')
      }
    })
    request.addEventListener('success', () => resolve(request.result))
    request.addEventListener('error', () => reject(request.error))
  })
}

const readFromNewConnection = async (key: string): Promise<unknown> => {
  const database = await openAuthDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction('auth', 'readonly').objectStore('auth').get(key)
      request.addEventListener('success', () => resolve(request.result))
      request.addEventListener('error', () => reject(request.error))
    })
  } finally {
    database.close()
  }
}

beforeAll(async () => {
  const database = await openAuthDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction('auth', 'readwrite')
    transaction.objectStore('auth').put('existing-token', 'existingToken')
    transaction.addEventListener('complete', () => resolve())
    transaction.addEventListener('error', () => reject(transaction.error))
    transaction.addEventListener('abort', () => reject(transaction.error))
  })
  database.close()
})

afterEach(async () => {
  setAuthPlatform(PlatformType.Web)
  await Promise.all([
    clearPersistentAuthValue('accessToken'),
    clearPersistentAuthValue('refreshToken'),
    clearPersistentAuthValue('userName'),
    clearPersistentAuthValue('roundTrip'),
    clearPersistentAuthValue('transactionFailure'),
  ])
})

test('uses in-memory storage when indexed db is unavailable', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB')
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: undefined })
  try {
    await setPersistentAuthValue('memoryOnly', 'memory-value')
    await expect(getPersistentAuthValue('memoryOnly')).resolves.toBe('memory-value')
    await clearPersistentAuthValue('memoryOnly')
    await expect(getPersistentAuthValue('memoryOnly')).resolves.toBe('')
  } finally {
    if (descriptor) {
      Object.defineProperty(globalThis, 'indexedDB', descriptor)
    }
  }
})

test('reads values from the existing auth database', async () => {
  await expect(getPersistentAuthValue('existingToken')).resolves.toBe('existing-token')
  await expect(getPersistentAuthValue('missingToken')).resolves.toBe('')
})

test('writes and deletes values that persist for a newly opened connection', async () => {
  await setPersistentAuthValue('roundTrip', 'stored-value')
  await expect(readFromNewConnection('roundTrip')).resolves.toBe('stored-value')
  await clearPersistentAuthValue('roundTrip')
  await expect(readFromNewConnection('roundTrip')).resolves.toBeUndefined()
})

test('rejects when a write transaction aborts', async () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(IDBDatabase.prototype, 'transaction')
  const originalTransaction = IDBDatabase.prototype.transaction
  Object.defineProperty(IDBDatabase.prototype, 'transaction', {
    configurable: true,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
    value: function (this: IDBDatabase, ...args: Parameters<IDBDatabase['transaction']>) {
      // eslint-disable-next-line unicorn/no-this-outside-of-class
      const transaction = originalTransaction.apply(this, args)
      queueMicrotask(() => transaction.abort())
      return transaction
    },
  })
  try {
    await expect(setPersistentAuthValue('transactionFailure', 'value')).rejects.toThrow()
  } finally {
    if (originalDescriptor) {
      Object.defineProperty(IDBDatabase.prototype, 'transaction', originalDescriptor)
    }
  }
})

test('electron stores, reads, and deletes tokens with secret storage', async () => {
  setAuthPlatform(PlatformType.Electron)
  using mockMainProcessRpc = MainProcess.registerMockRpc({
    'SecretStorage.delete'() {},
    'SecretStorage.get'() {
      return 'stored-token'
    },
    'SecretStorage.store'() {},
  })

  await setPersistentAuthValue('accessToken', 'new-token')
  await expect(getPersistentAuthValue('accessToken')).resolves.toBe('stored-token')
  await clearPersistentAuthValue('accessToken')

  expect(mockMainProcessRpc.invocations).toEqual([
    ['SecretStorage.store', 'lvce-editor.auth', 'accessToken', 'new-token'],
    ['SecretStorage.get', 'lvce-editor.auth', 'accessToken'],
    ['SecretStorage.delete', 'lvce-editor.auth', 'accessToken'],
  ])
})

test('electron ignores legacy tokens in indexed db', async () => {
  setAuthPlatform(PlatformType.Web)
  await setPersistentAuthValue('refreshToken', 'legacy-token')
  setAuthPlatform(PlatformType.Electron)
  using mockMainProcessRpc = MainProcess.registerMockRpc({
    'SecretStorage.get'() {},
    'SecretStorage.store'() {},
  })

  await expect(getPersistentAuthValue('refreshToken')).resolves.toBe('')

  expect(mockMainProcessRpc.invocations).toEqual([['SecretStorage.get', 'lvce-editor.auth', 'refreshToken']])
  setAuthPlatform(PlatformType.Web)
  await expect(getPersistentAuthValue('refreshToken')).resolves.toBe('legacy-token')
})

test('electron without a stored secret has no persisted auth value', async () => {
  setAuthPlatform(PlatformType.Electron)
  using mockMainProcessRpc = MainProcess.registerMockRpc({
    'SecretStorage.get'() {},
  })

  await expect(getPersistentAuthValue('accessToken')).resolves.toBe('')

  expect(mockMainProcessRpc.invocations).toEqual([['SecretStorage.get', 'lvce-editor.auth', 'accessToken']])
})

test('electron keeps non-secret auth values in indexed db', async () => {
  setAuthPlatform(PlatformType.Electron)
  using mockMainProcessRpc = MainProcess.registerMockRpc({})

  await setPersistentAuthValue('userName', 'Test User')
  await expect(getPersistentAuthValue('userName')).resolves.toBe('Test User')
  await clearPersistentAuthValue('userName')

  expect(mockMainProcessRpc.invocations).toEqual([])
})
