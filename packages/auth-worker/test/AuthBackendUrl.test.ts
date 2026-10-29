import { expect, test } from '@jest/globals'
import { RendererWorker } from '@lvce-editor/rpc-registry'
import { commandMap } from '../src/parts/CommandMap/CommandMap.ts'

test('the backend query observes successive renderer values without recursive auth calls', async () => {
  let backendUrl = 'https://first.test'
  using mockRendererWorkerRpc = RendererWorker.registerMockRpc({
    'Layout.getBackendUrl'(): string {
      return backendUrl
    },
  })
  await expect(commandMap['Auth.getBackendUrl']()).resolves.toBe('https://first.test')
  backendUrl = 'https://second.test'
  await expect(commandMap['Auth.getBackendUrl']()).resolves.toBe('https://second.test')
  expect(mockRendererWorkerRpc.invocations.map(([command]) => command)).toEqual(['Layout.getBackendUrl', 'Layout.getBackendUrl'])
})

test('an empty renderer backend stays empty', async () => {
  using mockRendererWorkerRpc = RendererWorker.registerMockRpc({
    'Layout.getBackendUrl'(): string {
      return ''
    },
  })
  expect(mockRendererWorkerRpc).toBeDefined()
  await expect(commandMap['Auth.getBackendUrl']()).resolves.toBe('')
})

test('renderer backend lookup failures are propagated', async () => {
  using mockRendererWorkerRpc = RendererWorker.registerMockRpc({
    'Layout.getBackendUrl'(): never {
      throw new Error('renderer unavailable')
    },
  })
  expect(mockRendererWorkerRpc).toBeDefined()
  await expect(commandMap['Auth.getBackendUrl']()).rejects.toThrow('renderer unavailable')
})
