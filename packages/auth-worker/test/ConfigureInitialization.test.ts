import { beforeEach, expect, jest, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'

const initializeAuthProcess = jest.fn<() => Promise<void>>(async () => {})
const initializeMainProcess = jest.fn<() => Promise<void>>(async () => {})
const { getProcessInitializers } = await import('../src/parts/Configure/Configure.ts')

beforeEach(() => {
  jest.clearAllMocks()
})

test('initializes both processes for Electron', async () => {
  await Promise.all(
    getProcessInitializers({ platform: PlatformType.Electron }, { initializeAuthProcess, initializeMainProcess }).map((initialize) => initialize()),
  )
  expect(initializeAuthProcess).toHaveBeenCalledTimes(1)
  expect(initializeMainProcess).toHaveBeenCalledTimes(1)
})

test('initializes only the auth process for native-auth web', async () => {
  await Promise.all(
    getProcessInitializers({ platform: PlatformType.Web, useNativeAuth: true }, { initializeAuthProcess, initializeMainProcess }).map((initialize) =>
      initialize(),
    ),
  )
  expect(initializeAuthProcess).toHaveBeenCalledTimes(1)
  expect(initializeMainProcess).not.toHaveBeenCalled()
})

test('does not initialize process connections for ordinary web', async () => {
  await Promise.all(
    getProcessInitializers({ platform: PlatformType.Web }, { initializeAuthProcess, initializeMainProcess }).map((initialize) => initialize()),
  )
  expect(initializeAuthProcess).not.toHaveBeenCalled()
  expect(initializeMainProcess).not.toHaveBeenCalled()
})
