import { clearPersistentAuthValue, getPersistentAuthValue, setPersistentAuthValue } from '../PersistentAuthValue/PersistentAuthValue.ts'

let storedRefreshToken = ''

export const clearStoredRefreshToken = async (): Promise<void> => {
  storedRefreshToken = ''
  await clearPersistentAuthValue('refreshToken')
}

export const getStoredRefreshToken = async (): Promise<string> => {
  if (!storedRefreshToken) {
    storedRefreshToken = await getPersistentAuthValue('refreshToken')
  }
  return storedRefreshToken
}

export const setStoredRefreshToken = async (value: string): Promise<void> => {
  storedRefreshToken = value
  await setPersistentAuthValue('refreshToken', value)
}
