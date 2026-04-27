import { errorHtml, successHtml } from '../OAuthCallbackHtml/OAuthCallbackHtml.ts'

export const getElectronRedirectUri = async (
  uid: number,
  invoke: (method: string, ...params: readonly string[]) => Promise<number | string>,
): Promise<string> => {
  return `http://127.0.0.1:${await invoke('OAuthServer.create', String(uid), successHtml, errorHtml)}/callback`
}
