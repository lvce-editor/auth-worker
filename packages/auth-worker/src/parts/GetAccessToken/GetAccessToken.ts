import { getPersistentAuthValue } from '../PersistentAuthValue/PersistentAuthValue.ts'

export const getAccessToken = (): Promise<string> => {
  return getPersistentAuthValue('accessToken')
}
