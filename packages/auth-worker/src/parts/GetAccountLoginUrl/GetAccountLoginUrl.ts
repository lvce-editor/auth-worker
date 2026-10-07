export const getAccountLoginUrl = (backendUrl: string, authorizationUrl: string): string => {
  const url = new URL('/login', backendUrl)
  url.searchParams.set('selectAccount', 'true')
  url.searchParams.set('returnTo', authorizationUrl)
  return url.href
}
