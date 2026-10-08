import type { AccountProfile } from '../AccountSessions/AccountSessions.ts'

export const getAccountProfile = async (backendUrl: string, accessToken: string, fetchFn: typeof fetch = fetch): Promise<AccountProfile> => {
  const response = await fetchFn(new URL('/account/me', backendUrl), {
    headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    throw new Error('Unable to load the signed in account.')
  }
  const value = (await response.json()) as Partial<AccountProfile>
  if (!value || typeof value.id !== 'string' || !value.id) {
    throw new Error('The backend did not return an account identity.')
  }
  return {
    ...(typeof value.avatarUrl === 'string' && { avatarUrl: value.avatarUrl }),
    displayName: typeof value.displayName === 'string' ? value.displayName : '',
    email: typeof value.email === 'string' ? value.email : '',
    id: value.id,
    provider: typeof value.provider === 'string' ? value.provider : 'LVCE Editor',
  }
}
