import { beforeEach, expect, jest, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'

const initializeAuthProcess = jest.fn<() => Promise<void>>(async () => {})
const initializeMainProcess = jest.fn<() => Promise<void>>(async () => {})
const { configure } = await import('../src/parts/Configure/Configure.ts')
const rendererWorker = { initializeAuthProcess, initializeMainProcess }

beforeEach(() => {
  jest.clearAllMocks()
})

test('initializes both processes for Electron', async () => {
  await configure({ platform: PlatformType.Electron }, rendererWorker)
  expect(initializeAuthProcess).toHaveBeenCalledTimes(1)
  expect(initializeMainProcess).toHaveBeenCalledTimes(1)
})

test('initializes only the auth process for native-auth web', async () => {
  await configure({ platform: PlatformType.Web, useNativeAuth: true }, rendererWorker)
  expect(initializeAuthProcess).toHaveBeenCalledTimes(1)
  expect(initializeMainProcess).not.toHaveBeenCalled()
})

test('does not initialize process connections for ordinary web', async () => {
  await configure({ platform: PlatformType.Web }, rendererWorker)
  expect(initializeAuthProcess).not.toHaveBeenCalled()
  expect(initializeMainProcess).not.toHaveBeenCalled()
})
