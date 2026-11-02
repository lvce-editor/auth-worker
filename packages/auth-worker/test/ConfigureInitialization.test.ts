import { beforeEach, expect, jest, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'

const initializeAuthProcess = jest.fn<() => Promise<void>>(async () => {})
const initializeMainProcess = jest.fn<() => Promise<void>>(async () => {})

jest.unstable_mockModule('@lvce-editor/rpc-registry', () => ({
  RendererWorker: {
    initializeAuthProcess,
    initializeMainProcess,
  },
}))

const { configure } = await import('../src/parts/Configure/Configure.ts')

beforeEach(() => {
  jest.clearAllMocks()
})

test('initializes both processes for Electron', async () => {
  await configure({ platform: PlatformType.Electron })
  expect(initializeAuthProcess).toHaveBeenCalledTimes(1)
  expect(initializeMainProcess).toHaveBeenCalledTimes(1)
})

test('initializes only the auth process for native-auth web', async () => {
  await configure({ platform: PlatformType.Web, useNativeAuth: true })
  expect(initializeAuthProcess).toHaveBeenCalledTimes(1)
  expect(initializeMainProcess).not.toHaveBeenCalled()
})

test('does not initialize process connections for ordinary web', async () => {
  await configure({ platform: PlatformType.Web })
  expect(initializeAuthProcess).not.toHaveBeenCalled()
  expect(initializeMainProcess).not.toHaveBeenCalled()
})
