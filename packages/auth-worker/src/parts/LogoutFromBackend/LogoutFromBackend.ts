import { getBackendLogoutUrl } from '../GetBackendLogoutUrl/GetBackendLogoutUrl.ts'
import { clearStoredRefreshToken, getStoredRefreshToken } from '../StoredRefreshToken/StoredRefreshToken.ts'

export const logoutFromBackend = async (backendUrl: string): Promise<void> => {
  if (!backendUrl) {
    await clearStoredRefreshToken()
    return
  }
  try {
    const storedRefreshToken = await getStoredRefreshToken()
    await fetch(getBackendLogoutUrl(backendUrl), {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(storedRefreshToken ? { Authorization: `Bearer ${storedRefreshToken}` } : {}),
      },
      method: 'POST',
    })
  } catch {
    // Ignore logout failures and still clear local auth state.
  } finally {
    await clearStoredRefreshToken()
  }
}
