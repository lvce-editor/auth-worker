import { MainProcess } from '@lvce-editor/rpc-registry'

const authStorageId = 'lvce-editor.auth'

export const deleteSecret = async (key: string): Promise<void> => {
  await MainProcess.deleteSecret(authStorageId, key)
}

export const getSecret = async (key: string): Promise<string> => {
  return (await MainProcess.getSecret(authStorageId, key)) ?? ''
}

export const storeSecret = async (key: string, value: string): Promise<void> => {
  await MainProcess.storeSecret(authStorageId, key, value)
}
