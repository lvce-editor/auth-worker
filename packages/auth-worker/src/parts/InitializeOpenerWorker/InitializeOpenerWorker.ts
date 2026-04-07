import { LazyTransferMessagePortRpcParent } from '@lvce-editor/rpc'
import { OpenerWorker, RendererWorker } from '@lvce-editor/rpc-registry'

const sendMessagePortToOpenerWorker = async (port: MessagePort): Promise<void> => {
  await RendererWorker.sendMessagePortToOpenerWorker(port, 0)
}

export const initializeOpenerWorker = async (): Promise<void> => {
  const rpc = await LazyTransferMessagePortRpcParent.create({
    commandMap: {},
    send: sendMessagePortToOpenerWorker,
  })
  OpenerWorker.set(rpc)
}
