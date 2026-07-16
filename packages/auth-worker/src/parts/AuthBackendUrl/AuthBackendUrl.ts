const state = {
  backendUrl: '',
}

export const getAuthBackendUrl = (): string => {
  return state.backendUrl
}

export const setAuthBackendUrl = (backendUrl: string): void => {
  state.backendUrl = backendUrl
}
