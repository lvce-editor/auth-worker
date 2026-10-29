import { RendererWorker } from '@lvce-editor/rpc-registry'

export const getAuthBackendUrl = async (backendUrl?: string): Promise<string> => {
  if (typeof backendUrl === 'string') {
    return backendUrl
  }
  return RendererWorker.invoke('Layout.getBackendUrl')
}
