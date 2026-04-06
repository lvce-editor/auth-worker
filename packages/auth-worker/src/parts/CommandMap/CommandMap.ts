import { handleMessagePort } from '../HandleMessagePort/HandleMessagePort.ts'
import { initialize } from '../Initialize/Initialize.ts'
import { handleClickLogin } from '../Login/Login.ts'
import { logout } from '../Logout/Logout.ts'
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
  'Auth.consumeNextLoginResponse': consumeNextLoginResponse,
  'Auth.consumeNextRefreshResponse': consumeNextRefreshResponse,
  'Auth.hasPendingMockLoginResponse': hasPendingMockLoginResponse,
  'Auth.hasPendingMockRefreshResponse': hasPendingMockRefreshResponse,
  'Auth.initialize': initialize,
  'Auth.login': handleClickLogin,
  'Auth.logout': logout,
  'Auth.setNextLoginResponse': setNextLoginResponse,
  'Auth.setNextRefreshResponse': setNextRefreshResponse,
  'HandleMessagePort.handleMessagePort': handleMessagePort,
}
