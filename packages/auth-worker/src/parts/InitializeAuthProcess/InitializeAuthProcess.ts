import { LazyTransferMessagePortRpcParent } from '@lvce-editor/rpc'
import { AuthProcess, RendererWorker } from '@lvce-editor/rpc-registry'

const sendMessagePortToAuthProcess = async (port: MessagePort): Promise<void> => {
  // TODO
  await RendererWorker.sendMessagePortToOpenerWorker(port, 0)
}

export const initializeAuthProcess = async (): Promise<void> => {
  const rpc = await LazyTransferMessagePortRpcParent.create({
    commandMap: {},
    send: sendMessagePortToAuthProcess,
  })
  AuthProcess.set(rpc)
}
