import { exchangeElectronAuthorizationCode } from '../ExchangeElectronAuthorizationCode/ExchangeElectronAuthorizationCode.ts'
import { getCurrentHref } from '../GetCurrentHref/GetCurrentHref.ts'
import { clearPendingOidcTransaction, getPendingOidcTransaction } from '../PendingOidcTransaction/PendingOidcTransaction.ts'
import { clearStoredAuthError, setStoredAuthError } from '../StoredAuthError/StoredAuthError.ts'

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
    await setStoredAuthError('Backend authentication failed: missing OIDC transaction.')
    return false
  }
  if (error) {
    await setStoredAuthError(errorDescription || error)
    return false
  }
  if (!code) {
    await setStoredAuthError('Backend authentication failed: missing authorization code.')
    return false
  }
  if (!state || state !== transaction.state) {
    await setStoredAuthError('Backend authentication failed: invalid state parameter.')
    return false
  }
  try {
    await exchangeElectronAuthorizationCode(transaction.backendUrl, code, transaction.codeVerifier, transaction.redirectUri)
    await clearStoredAuthError()
    return true
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : 'Backend authentication failed.'
    await setStoredAuthError(message)
    return false
  }
}
