import { PlainMessagePortRpc, type Rpc } from '@lvce-editor/rpc'
import { AuthProcess, RendererWorker } from '@lvce-editor/rpc-registry'

const connect = async (): Promise<Rpc> => {
  const { port1, port2 } = new MessageChannel()
  const closed = Promise.withResolvers<Error>()
  const handleClose = (): void => closed.resolve(new Error('Auth process connection closed'))
  port2.addEventListener('close', handleClose, { once: true })
  const failOnClose = async (): Promise<never> => {
    throw await closed.promise
  }
  const raceClose = (promise: Readonly<Promise<unknown>>): Promise<any> => Promise.race([promise, failOnClose()])
  try {
    await raceClose(
      RendererWorker.invokeAndTransfer(
        'SendMessagePortToExtensionHostWorker.sendMessagePortToSharedProcess',
        port1,
        'HandleMessagePortForAuthProcess.handleMessagePortForAuthProcess',
      ),
    )
    const rpc = await PlainMessagePortRpc.create({ commandMap: {}, messagePort: port2 })
    return {
      async dispose(): Promise<void> {
        handleClose()
        port2.removeEventListener('close', handleClose)
        await rpc.dispose()
      },
      invoke: (method: string, ...params: readonly unknown[]) => raceClose(rpc.invoke(method, ...params)),
      invokeAndTransfer: (method: string, ...params: readonly unknown[]) => raceClose(rpc.invokeAndTransfer(method, ...params)),
      send: rpc.send,
    }
  } catch (error) {
    port2.removeEventListener('close', handleClose)
    port1.close()
    port2.close()
    throw error
  }
}

export const createAuthProcessRpc = (create: () => Promise<Rpc> = connect): Rpc => {
  let pending: Promise<Rpc> | undefined
  const get = (): Promise<Rpc> => {
    if (!pending) {
      pending = create()
    }
    return pending
  }
  return {
    async dispose(): Promise<void> {
      const previous = pending
      // Detach before awaiting: a new login may connect while the old port closes.
      pending = undefined
      if (previous) {
        const rpc = await previous
        await rpc.dispose()
      }
    },
    async invoke(method: string, ...params: readonly unknown[]): Promise<any> {
      const rpc = await get()
      return rpc.invoke(method, ...params)
    },
    async invokeAndTransfer(method: string, ...params: readonly unknown[]): Promise<any> {
      const rpc = await get()
      return rpc.invokeAndTransfer(method, ...params)
    },
    send(method: string, ...params: readonly unknown[]): void {
      void get().then((rpc) => rpc.send(method, ...params))
    },
  }
}

export const initializeAuthProcess = async (): Promise<void> => {
  AuthProcess.set(createAuthProcessRpc())
}
