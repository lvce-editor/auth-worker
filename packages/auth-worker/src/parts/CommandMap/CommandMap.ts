import { handleMessagePort } from '../HandleMessagePort/HandleMessagePort.ts'
import { initialize } from '../Initialize/Initialize.ts'
import { handleClickLogin } from '../Login/Login.ts'
import { logout } from '../Logout/Logout.ts'
import { clear } from '../MockBackendAuth/MockBackendAuth.ts'

export const commandMap = {
  'Auth.clearMocks': clear,
  'Auth.initialize': initialize,
  'Auth.login': handleClickLogin,
  'Auth.logout': logout,
  'HandleMessagePort.handleMessagePort': handleMessagePort,
}
