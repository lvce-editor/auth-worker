import { errorHtml, successHtml } from '../OAuthCallbackHtml/OAuthCallbackHtml.ts'

export const getElectronRedirectUri = async (
  uid: number,
  invoke: (method: string, ...params: readonly string[]) => Promise<number | string>,
): Promise<string> => {
  const localOauthServerPort = await invoke('OAuthServer.create', String(uid), successHtml, errorHtml)
  return `http://localhost:${localOauthServerPort}`
}
