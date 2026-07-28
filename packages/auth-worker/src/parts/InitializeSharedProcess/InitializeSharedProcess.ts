import { LazyTransferMessagePortRpcParent } from '@lvce-editor/rpc'
import { RendererWorker, SharedProcess } from '@lvce-editor/rpc-registry'

const sendMessagePortToSharedProcess = async (port: MessagePort): Promise<void> => {
  await RendererWorker.sendMessagePortToSharedProcess(port)
}

export const initializeSharedProcess = async (): Promise<void> => {
  const rpc = await LazyTransferMessagePortRpcParent.create({
    commandMap: {},
    send: sendMessagePortToSharedProcess,
  })
  SharedProcess.set(rpc)
}
