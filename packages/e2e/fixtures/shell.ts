import { PlatformType, RpcId } from '@lvce-editor/constants'
import { MessagePortRpcClient, ModuleWorkerRpcParent, type Rpc } from '@lvce-editor/rpc'

declare global {
  var authProcessCommand: (method: string, ...params: readonly unknown[]) => Promise<unknown>
  var openAuthorizationUrl: (url: string) => Promise<void>
  var auth: Rpc | undefined
}

// Only the surrounding shell is supplied by the fixture. Authentication commands,
// token validation, persistence and the callback listener use the shipped code.
const backendUrl = location.origin
const commandMap = {
  'Layout.getBackendUrl': (): string => backendUrl,
  'Open.openUrl': (url: string): Promise<void> => globalThis.openAuthorizationUrl(url),
  'OAuthServer.create': (...params: readonly unknown[]): Promise<unknown> => globalThis.authProcessCommand('OAuthServer.create', ...params),
  'OAuthServer.dispose': (...params: readonly unknown[]): Promise<unknown> => globalThis.authProcessCommand('OAuthServer.dispose', ...params),
  'OAuthServer.getCode': (...params: readonly unknown[]): Promise<unknown> => globalThis.authProcessCommand('OAuthServer.getCode', ...params),
  'SendMessagePortToExtensionHostWorker.sendMessagePortToOpenerWorker': async (port: MessagePort): Promise<void> => {
    await MessagePortRpcClient.create({ commandMap: {}, messagePort: port })
  },
  'SendMessagePortToExtensionHostWorker.sendMessagePortToSharedProcess': async (port: MessagePort): Promise<void> => {
    await MessagePortRpcClient.create({ commandMap: {}, messagePort: port })
  },
}

const auth = await ModuleWorkerRpcParent.create({ commandMap, name: 'AuthWorker', url: '/authWorkerMain.js' })
const { port1, port2 } = new MessageChannel()
await MessagePortRpcClient.create({ commandMap: {}, messagePort: port1 })
await auth.invokeAndTransfer('HandleMessagePort.handleMessagePort', port2, RpcId.RendererWorker)
await auth.invoke('Auth.configure', { platform: PlatformType.Web, useNativeAuth: true })
globalThis.auth = auth
