import { getAccessToken } from '../AccountAuth/AccountAuth.ts'
import { getAuthBackendUrl } from '../AuthBackendUrl/AuthBackendUrl.ts'

const identifier = /^[a-f0-9]{32}$/
const confirmationCode = /^[A-F0-9]{8}$/

export const getCloudflareConnectionsUrl = (): string => new URL('/cloudflare', getAuthBackendUrl()).href

const request = async (pathname: string, method = 'GET', body?: unknown): Promise<unknown> => {
  const backendUrl = getAuthBackendUrl()
  const accessToken = await getAccessToken({ refresh: 'if-needed' })
  if (backendUrl !== getAuthBackendUrl()) throw new Error('Account backend changed. Retry Cloudflare setup.')
  if (!accessToken) throw new Error('Sign in to LVCE to manage Cloudflare connections.')
  const response = await fetch(new URL(pathname, backendUrl), {
    headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    method,
    redirect: 'error',
    signal: AbortSignal.timeout(30_000),
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })
  if (!response.ok)
    throw new Error(`Cloudflare connection request failed (${response.status}). Open account connections to check authorization and domains.`)
  return response.json()
}
export const getCloudflareStatus = (): Promise<unknown> => request('/cloudflare/status')
export const getCloudflareZones = (): Promise<unknown> => request('/cloudflare/zones')
export const approveCloudflareMachine = (id: string, code: string, zoneId: string): Promise<unknown> => {
  if (!identifier.test(id) || !identifier.test(zoneId) || !confirmationCode.test(code)) throw new Error('Invalid Cloudflare setup code or domain.')
  return request(`/cloudflare/setup/${id}/approve`, 'POST', { code, zoneId })
}
