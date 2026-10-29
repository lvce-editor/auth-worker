import type { Rpc } from '@lvce-editor/rpc'
import { expect, jest, test } from '@jest/globals'
import { AuthProcess, RendererWorker } from '@lvce-editor/rpc-registry'
import { createAuthProcessRpc, initializeAuthProcess } from '../src/parts/InitializeAuthProcess/InitializeAuthProcess.ts'

const createRpc = (): Rpc => ({
  dispose: jest.fn(async () => {}),
  invoke: jest.fn(async () => 'result'),
  invokeAndTransfer: jest.fn(async () => 'transfer'),
  send: jest.fn(),
})

test('does not start an unused process during disposal', async () => {
  const create = jest.fn(async () => createRpc())
  const rpc = createAuthProcessRpc(create)
  await rpc.dispose()
  expect(create).not.toHaveBeenCalled()
})

test('shares the active connection and replaces it before awaiting disposal', async () => {
  const first = createRpc()
  const second = createRpc()
  const closing = Promise.withResolvers<void>()
  jest.mocked(first.dispose).mockReturnValue(closing.promise)
  const create = jest.fn<() => Promise<Rpc>>().mockResolvedValueOnce(first).mockResolvedValueOnce(second)
  const rpc = createAuthProcessRpc(create)
  await Promise.all([rpc.invoke('one'), rpc.invoke('two')])
  expect(create).toHaveBeenCalledTimes(1)
  const disposal = rpc.dispose()
  expect(await rpc.invoke('three')).toBe('result')
  expect(second.invoke).toHaveBeenCalledWith('three')
  closing.resolve()
  await disposal
  expect(first.dispose).toHaveBeenCalledTimes(1)
  expect(second.dispose).not.toHaveBeenCalled()
  await rpc.dispose()
})

test('clears a failed launch on release so a later login can retry', async () => {
  const create = jest.fn<() => Promise<Rpc>>().mockRejectedValueOnce(new Error('launch failed')).mockResolvedValueOnce(createRpc())
  const rpc = createAuthProcessRpc(create)
  await expect(rpc.invoke('create')).rejects.toThrow('launch failed')
  await expect(rpc.invoke('cleanup')).rejects.toThrow('launch failed')
  expect(create).toHaveBeenCalledTimes(1)
  await expect(rpc.dispose()).rejects.toThrow('launch failed')
  await expect(rpc.invoke('retry')).resolves.toBe('result')
  await expect(rpc.invokeAndTransfer('transfer')).resolves.toBe('transfer')
  await rpc.dispose()
})

test('unexpected peer closure rejects pending calls instead of leaving login cleanup hung', async () => {
  const received = Promise.withResolvers<MessagePort>()
  using renderer = RendererWorker.registerMockRpc({
    'SendMessagePortToExtensionHostWorker.sendMessagePortToSharedProcess'(port: MessagePort): void {
      received.resolve(port)
    },
  })
  await initializeAuthProcess()
  const call = AuthProcess.invoke('pending')
  const peer = await received.promise
  peer.close()
  await expect(call).rejects.toThrow('Auth process connection closed')
  await AuthProcess.dispose()
  expect(renderer.invocations).toHaveLength(1)
})
