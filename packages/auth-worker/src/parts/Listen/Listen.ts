import { initializeAuthProcess } from '../InitializeAuthProcess/InitializeAuthProcess.ts'
import { initializeOpenerWorker } from '../InitializeOpenerWorker/InitializeOpenerWorker.ts'
import { initializeRendererWorker } from '../InitializeRendererWorker/InitializeRendererWorker.ts'
import { initializeSharedProcess } from '../InitializeSharedProcess/InitializeSharedProcess.ts'

export const listen = async (): Promise<void> => {
  await Promise.all([initializeRendererWorker(), initializeOpenerWorker(), initializeAuthProcess(), initializeSharedProcess()])
}
