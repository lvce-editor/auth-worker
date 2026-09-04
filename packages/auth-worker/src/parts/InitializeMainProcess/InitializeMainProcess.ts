import { LazyTransferMessagePortRpcParent } from '@lvce-editor/rpc'
import { MainProcess, RendererWorker } from '@lvce-editor/rpc-registry'

const sendMessagePortToMainProcess = async (port: MessagePort): Promise<void> => {
  await RendererWorker.invokeAndTransfer(
    'SendMessagePortToMainProcess.sendMessagePortToMainProcess',
    port,
    'HandleElectronMessagePort.handleElectronMessagePort',
    0,
  )
}

export const initializeMainProcess = async (): Promise<void> => {
  const rpc = await LazyTransferMessagePortRpcParent.create({
    commandMap: {},
    send: sendMessagePortToMainProcess,
  })
  MainProcess.set(rpc)
}
