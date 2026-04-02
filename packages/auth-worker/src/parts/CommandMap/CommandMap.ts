import { handleMessagePort } from '../HandleMessagePort/HandleMessagePort.ts'
import { initialize } from '../Initialize/Initialize.ts'

export const commandMap = {
  'AUth.initialize': initialize,
  'HandleMessagePort.handleMessagePort': handleMessagePort,
}
