const databaseName = 'auth-worker'
const objectStoreName = 'auth'

const memoryStorage = new Map<string, string>()

let databasePromise: Promise<IDBDatabase | undefined> | undefined

// IndexedDB request objects are mutable browser primitives and cannot satisfy the readonly rule structurally.
// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => {
      resolve(request.result)
    })
    request.addEventListener('error', () => {
      reject(request.error ?? new Error('Persistent storage request failed.'))
    })
  })
}

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
const transactionToPromise = (transaction: IDBTransaction): Promise<void> => {
  return new Promise((resolve, reject) => {
    transaction.addEventListener('complete', () => {
      resolve()
    })
    transaction.addEventListener('abort', () => {
      reject(transaction.error ?? new Error('Persistent storage transaction failed.'))
    })
    transaction.addEventListener('error', () => {
      reject(transaction.error ?? new Error('Persistent storage transaction failed.'))
    })
  })
}

const getDatabase = async (): Promise<IDBDatabase | undefined> => {
  if (typeof indexedDB === 'undefined') {
    return undefined
  }
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1)
      request.addEventListener('upgradeneeded', () => {
        const database = request.result
        if (!database.objectStoreNames.contains(objectStoreName)) {
          database.createObjectStore(objectStoreName)
        }
      })
      request.addEventListener('success', () => {
        resolve(request.result)
      })
      request.addEventListener('error', () => {
        reject(request.error ?? new Error('Failed to open persistent auth storage.'))
      })
    })
  }
  return databasePromise
}

export const getPersistentAuthValue = async (key: string): Promise<string> => {
  const database = await getDatabase()
  if (!database) {
    return memoryStorage.get(key) ?? ''
  }
  const transaction = database.transaction(objectStoreName, 'readonly')
  const objectStore = transaction.objectStore(objectStoreName)
  const value = await requestToPromise(objectStore.get(key))
  return typeof value === 'string' ? value : ''
}

export const setPersistentAuthValue = async (key: string, value: string): Promise<void> => {
  memoryStorage.set(key, value)
  const database = await getDatabase()
  if (!database) {
    return
  }
  const transaction = database.transaction(objectStoreName, 'readwrite')
  const objectStore = transaction.objectStore(objectStoreName)
  objectStore.put(value, key)
  await transactionToPromise(transaction)
}

export const clearPersistentAuthValue = async (key: string): Promise<void> => {
  memoryStorage.delete(key)
  const database = await getDatabase()
  if (!database) {
    return
  }
  const transaction = database.transaction(objectStoreName, 'readwrite')
  const objectStore = transaction.objectStore(objectStoreName)
  objectStore.delete(key)
  await transactionToPromise(transaction)
}
