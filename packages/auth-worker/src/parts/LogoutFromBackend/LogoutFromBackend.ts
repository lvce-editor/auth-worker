import { getBackendLogoutUrl } from '../GetBackendLogoutUrl/GetBackendLogoutUrl.ts'

export const logoutFromBackend = async (backendUrl: string): Promise<void> => {
  if (!backendUrl) {
    return
  }
  try {
    await fetch(getBackendLogoutUrl(backendUrl), {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
      method: 'POST',
    })
  } catch {
    // Ignore logout failures and still clear local auth state.
  }
}
