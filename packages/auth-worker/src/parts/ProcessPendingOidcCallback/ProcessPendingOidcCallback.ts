import { exchangeElectronAuthorizationCode } from '../ExchangeElectronAuthorizationCode/ExchangeElectronAuthorizationCode.ts'
import { getCurrentHref } from '../GetCurrentHref/GetCurrentHref.ts'
import { clearPendingOidcTransaction, getPendingOidcTransaction } from '../PendingOidcTransaction/PendingOidcTransaction.ts'
import { clearStoredAuthError, setStoredAuthError } from '../StoredAuthError/StoredAuthError.ts'
import { clearStoredRefreshToken, setStoredRefreshToken } from '../StoredRefreshToken/StoredRefreshToken.ts'

const getCallbackUrl = async (): Promise<URL | undefined> => {
  const href = await getCurrentHref()
  if (!href) {
    return undefined
  }
  try {
    return new URL(href)
  } catch {
    return undefined
  }
}

export const processPendingOidcCallback = async (): Promise<boolean> => {
  const callbackUrl = await getCallbackUrl()
  if (!callbackUrl) {
    return false
  }
  const code = callbackUrl.searchParams.get('code') || ''
  const state = callbackUrl.searchParams.get('state') || ''
  const error = callbackUrl.searchParams.get('error') || ''
  const errorDescription = callbackUrl.searchParams.get('error_description') || ''
  if (!code && !error) {
    return false
  }
  const transaction = await getPendingOidcTransaction()
  await clearPendingOidcTransaction()
  if (!transaction) {
    await clearStoredRefreshToken()
    await setStoredAuthError('Backend authentication failed: missing OIDC transaction.')
    return false
  }
  if (error) {
    await clearStoredRefreshToken()
    await setStoredAuthError(errorDescription || error)
    return false
  }
  if (!code) {
    await clearStoredRefreshToken()
    await setStoredAuthError('Backend authentication failed: missing authorization code.')
    return false
  }
  if (!state || state !== transaction.state) {
    await clearStoredRefreshToken()
    await setStoredAuthError('Backend authentication failed: invalid state parameter.')
    return false
  }
  try {
    const refreshToken = await exchangeElectronAuthorizationCode(transaction.backendUrl, code, transaction.codeVerifier, transaction.redirectUri)
    await setStoredRefreshToken(refreshToken)
    await clearStoredAuthError()
    return true
  } catch (error) {
    await clearStoredRefreshToken()
    const message = error instanceof Error && error.message ? error.message : 'Backend authentication failed.'
    await setStoredAuthError(message)
    return false
  }
}
