import { expect, test } from '@jest/globals'
import { RpcId } from '@lvce-editor/constants'
import { get, RendererWorker } from '@lvce-editor/rpc-registry'
import { initializeMainProcess } from '../src/parts/InitializeMainProcess/InitializeMainProcess.ts'

test('initializes a lazy direct connection to the main process', async () => {
  using mockRendererWorkerRpc = RendererWorker.registerMockRpc({
    'SendMessagePortToMainProcess.sendMessagePortToMainProcess'() {},
  })

  await initializeMainProcess()
  expect(mockRendererWorkerRpc.invocations).toEqual([])

  const rpc = get(RpcId.MainProcess)
  rpc.send('test')
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(mockRendererWorkerRpc.invocations).toEqual([
    ['SendMessagePortToMainProcess.sendMessagePortToMainProcess', expect.anything(), 'HandleElectronMessagePort.handleElectronMessagePort', 0],
  ])
  await rpc.dispose()
})
