import { SharedProcess } from '@lvce-editor/rpc-registry'

const authStorageId = 'lvce-editor.auth'

export const deleteSecret = async (key: string): Promise<void> => {
  await SharedProcess.invoke('SecretStorage.delete', authStorageId, key)
}

export const getSecret = async (key: string): Promise<string> => {
  const value = await SharedProcess.invoke('SecretStorage.get', authStorageId, key)
  return typeof value === 'string' ? value : ''
}

export const storeSecret = async (key: string, value: string): Promise<void> => {
  await SharedProcess.invoke('SecretStorage.store', authStorageId, key, value)
}
