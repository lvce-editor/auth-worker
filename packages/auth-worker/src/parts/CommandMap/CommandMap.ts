import { RpcId } from '@lvce-editor/constants'
import {
  disconnectConnectedAccount,
  getAccessToken,
  getAccounts,
  getConnectedAccounts,
  initialize,
  login,
  logout,
  removeAccount,
  syncBackendAuth,
  useAccount,
} from '../AccountAuth/AccountAuth.ts'
import { configure } from '../Configure/Configure.ts'
import { handleMessagePort } from '../HandleMessagePort/HandleMessagePort.ts'
import {
  clear,
  consumeNextLoginResponse,
  consumeNextRefreshResponse,
  hasPendingMockLoginResponse,
  hasPendingMockRefreshResponse,
  setNextLoginResponse,
  setNextRefreshResponse,
} from '../MockBackendAuth/MockBackendAuth.ts'

export const commandMap = {
  'Auth.clearMocks': clear,
  'Auth.configure': configure,
  'Auth.consumeNextLoginResponse': consumeNextLoginResponse,
  'Auth.consumeNextRefreshResponse': consumeNextRefreshResponse,
  'Auth.disconnectConnectedAccount': disconnectConnectedAccount,
  'Auth.getAccessToken': getAccessToken,
  'Auth.getAccounts': getAccounts,
  'Auth.getConnectedAccounts': getConnectedAccounts,
  'Auth.hasPendingMockLoginResponse': hasPendingMockLoginResponse,
  'Auth.hasPendingMockRefreshResponse': hasPendingMockRefreshResponse,
  'Auth.initialize': initialize,
  'Auth.login': login,
  'Auth.logout': logout,
  'Auth.removeAccount': removeAccount,
  'Auth.setNextLoginResponse': setNextLoginResponse,
  'Auth.setNextRefreshResponse': setNextRefreshResponse,
  'Auth.syncBackendAuth': syncBackendAuth,
  'Auth.useAccount': useAccount,
  'HandleMessagePort.handleMessagePort': handleMessagePort,
  initialize: (_: string, port: MessagePort): Promise<void> => handleMessagePort(port, RpcId.RendererWorker),
}
