import { AuthProcess } from '@lvce-editor/rpc-registry'
import { errorHtml, successHtml } from '../OAuthCallbackHtml/OAuthCallbackHtml.ts'

export const getElectronRedirectUri = async (uid: number): Promise<string> => {
  const localOauthServerPort = await AuthProcess.invoke('OAuthServer.create', String(uid), successHtml, errorHtml)
  return `http://localhost:${localOauthServerPort}/callback`
}
