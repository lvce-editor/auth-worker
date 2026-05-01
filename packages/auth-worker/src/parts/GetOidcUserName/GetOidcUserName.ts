const getPayload = async (response: Response): Promise<unknown> => {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

export const getOidcUserName = async (backendUrl: string, accessToken: string, fetchFn: typeof fetch = fetch): Promise<string> => {
  if (!backendUrl || !accessToken) {
    return ''
  }
  const response = await fetchFn(new URL('/account/me', backendUrl), {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!response.ok) {
    return ''
  }
  const payload = await getPayload(response)
  if (!payload || typeof payload !== 'object') {
    return ''
  }
  const displayName = Reflect.get(payload, 'displayName')
  return typeof displayName === 'string' ? displayName : ''
}
