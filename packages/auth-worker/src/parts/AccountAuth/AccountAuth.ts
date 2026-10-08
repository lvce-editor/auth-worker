import type { AccountProfile, AccountSession } from '../AccountSessions/AccountSessions.ts'
import type { LoginOptions, LoginResult } from '../HandleClickLoginTypes/HandleClickLoginTypes.ts'
import { getAccessTokenExpiresAt, isAccessTokenValid } from '../AccessTokenExpiration/AccessTokenExpiration.ts'
import { createAccountSessions } from '../AccountSessions/AccountSessions.ts'
import { getAuthBackendUrl } from '../AuthBackendUrl/AuthBackendUrl.ts'
import { setAuthPlatform } from '../AuthPlatform/AuthPlatform.ts'
import { completeBrowserOidcLogin } from '../CompleteBrowserOidcLogin/CompleteBrowserOidcLogin.ts'
import { getAccountProfile } from '../GetAccountProfile/GetAccountProfile.ts'
import { getLoggedOutBackendAuthState } from '../GetLoggedOutBackendAuthState/GetLoggedOutBackendAuthState.ts'
import { handleClickLogin } from '../HandleClickLogin/HandleClickLogin.ts'
import { clearPersistedAuthSession, getPersistedAuthSession } from '../PersistedAuthSession/PersistedAuthSession.ts'
import { getPersistentAuthValue, setPersistentAuthValue } from '../PersistentAuthValue/PersistentAuthValue.ts'
import { refreshOidcTokens } from '../RefreshOidcTokens/RefreshOidcTokens.ts'

const storageKey = 'accountSessions'
const accounts = createAccountSessions({
  read: () => getPersistentAuthValue(storageKey),
  write: (value) => setPersistentAuthValue(storageKey, value),
})
const refreshes = new Map<string, Promise<void>>()
const state = { login: undefined as Promise<LoginResult> | undefined, migration: undefined as Promise<void> | undefined }

const normalizeBackendUrl = (backendUrl: string): string => new URL(backendUrl).origin

const addSession = async (backendUrl: string, session: LoginResult, revision: number): Promise<void> => {
  if (session.userState !== 'loggedIn' || !session.authAccessToken) {
    return
  }
  const profile = await getAccountProfile(backendUrl, session.authAccessToken)
  await accounts.add({ backendUrl, id: `${backendUrl}/${profile.id}`, profile, session: { ...session, userName: profile.displayName } }, revision)
}

const migrate = async (backendUrl: string): Promise<void> => {
  if (await getPersistentAuthValue(storageKey)) {
    return
  }
  const legacy = await getPersistedAuthSession()
  if (legacy) {
    if (legacy.authClientId && legacy.authRefreshToken) {
      const tokens = await refreshOidcTokens(backendUrl, legacy.authClientId, legacy.authRefreshToken)
      const authAccessTokenExpiresAt = getAccessTokenExpiresAt(tokens.expiresIn)
      const { authAccessTokenExpiresAt: _legacyExpiry, ...legacySession } = legacy
      await addSession(
        backendUrl,
        {
          ...legacySession,
          authAccessToken: tokens.accessToken,
          ...(authAccessTokenExpiresAt && { authAccessTokenExpiresAt }),
          authRefreshToken: tokens.refreshToken,
        },
        0,
      )
    } else {
      await addSession(backendUrl, legacy, 0)
    }
  } else {
    await setPersistentAuthValue(storageKey, JSON.stringify({ accounts: [], activeId: '', revision: 0 }))
  }
  // Clear legacy credentials only after the registry is durably committed.
  await clearPersistedAuthSession()
}

const ensureMigrated = async (backendUrl = getAuthBackendUrl()): Promise<string> => {
  const url = normalizeBackendUrl(backendUrl)
  if (!state.migration) {
    state.migration = (async (): Promise<void> => {
      try {
        await migrate(url)
      } catch (error) {
        state.migration = undefined
        throw error
      }
    })()
  }
  await state.migration
  return url
}

const getActive = async (backendUrl: string): Promise<AccountSession | undefined> => {
  const registry = await accounts.read()
  return registry.accounts.find((account) => account.id === registry.activeId && account.backendUrl === backendUrl)
}

const getCurrentState = async (backendUrl: string, authErrorMessage = ''): Promise<LoginResult> => {
  const account = await getActive(backendUrl)
  return account ? { ...account.session, authErrorMessage } : getLoggedOutBackendAuthState(authErrorMessage)
}

const refresh = async (account: AccountSession): Promise<void> => {
  const { backendUrl, session } = account
  if (!session.authClientId || !session.authRefreshToken) {
    if (session.authAccessTokenExpiresAt && session.authAccessTokenExpiresAt <= Date.now()) {
      await accounts.update(account, getLoggedOutBackendAuthState('Please sign in to this account again.'))
    }
    return
  }
  const key = `${account.id}/${session.authRefreshToken}`
  const pending = refreshes.get(key)
  if (pending) {
    return pending
  }
  const operation = (async (): Promise<void> => {
    const tokens = await refreshOidcTokens(backendUrl, session.authClientId!, session.authRefreshToken!)
    const authAccessTokenExpiresAt = getAccessTokenExpiresAt(tokens.expiresIn)
    const { authAccessTokenExpiresAt: _previousExpiry, ...previousSession } = session
    await accounts.update(account, {
      ...previousSession,
      authAccessToken: tokens.accessToken,
      ...(authAccessTokenExpiresAt && { authAccessTokenExpiresAt }),
      authRefreshToken: tokens.refreshToken,
    })
  })()
  refreshes.set(key, operation)
  try {
    await operation
  } catch (error) {
    // Network errors must not destroy a retained session. A rejected grant needs another login.
    if (error && typeof error === 'object' && 'error' in error && error.error === 'invalid_grant') {
      await accounts.update(account, getLoggedOutBackendAuthState('Please sign in to this account again.'))
    }
    throw error
  } finally {
    refreshes.delete(key)
  }
}

export interface AccountSummary extends AccountProfile {
  readonly active: boolean
  readonly color: string
  readonly signedIn: boolean
}

export interface ConnectedAccount {
  readonly id: string
  readonly name: string
  readonly provider: string
}

const getConnectedAccountsUrl = (backendUrl: string): URL => new URL('/account/connections', backendUrl)

const getConnectedAccountDisconnectUrl = (backendUrl: string, provider: string): URL =>
  new URL(`/account/connections/${encodeURIComponent(provider)}/disconnect`, backendUrl)

const getConnectionRequestHeaders = (accessToken: string): HeadersInit => {
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
  }
}

export const getConnectedAccounts = async (): Promise<readonly ConnectedAccount[]> => {
  const backendUrl = await ensureMigrated()
  const accessToken = await getAccessToken({ refresh: 'if-needed' })
  if (!accessToken) {
    return []
  }
  const response = await fetch(getConnectedAccountsUrl(backendUrl), {
    headers: getConnectionRequestHeaders(accessToken),
  })
  if (!response.ok) {
    throw new Error(`Unable to load connected accounts (${response.status}).`)
  }
  const payload: unknown = await response.json()
  if (!payload || typeof payload !== 'object' || !Array.isArray((payload as { connections?: unknown }).connections)) {
    throw new Error('Backend returned invalid connected accounts.')
  }
  return (payload as { connections: ConnectedAccount[] }).connections
}

export const disconnectConnectedAccount = async (provider: string): Promise<void> => {
  const backendUrl = await ensureMigrated()
  const accessToken = await getAccessToken({ refresh: 'if-needed' })
  if (!accessToken) {
    throw new Error('Sign in to disconnect connected accounts.')
  }
  const response = await fetch(getConnectedAccountDisconnectUrl(backendUrl, provider), {
    headers: getConnectionRequestHeaders(accessToken),
    method: 'POST',
  })
  if (!response.ok) {
    throw new Error(`Unable to disconnect ${provider} (${response.status}).`)
  }
}

export const getAccounts = async (): Promise<readonly AccountSummary[]> => {
  const backendUrl = await ensureMigrated()
  const registry = await accounts.read()
  return registry.accounts
    .filter((account) => account.backendUrl === backendUrl)
    .map((account) => ({
      ...account.profile,
      active: account.id === registry.activeId,
      color: 'blue',
      id: account.id,
      signedIn: account.session.userState === 'loggedIn',
    }))
}

export const getAccessToken = async (options: { readonly refresh?: 'if-needed' | 'always' } = {}): Promise<string> => {
  const backendUrl = await ensureMigrated()
  const account = await getActive(backendUrl)
  if (!account) {
    return ''
  }
  if (
    options.refresh === 'always' ||
    (options.refresh === 'if-needed' &&
      !isAccessTokenValid(account.session.authAccessToken || '', String(account.session.authAccessTokenExpiresAt || '')))
  ) {
    try {
      await refresh(account)
    } catch (error) {
      const selected = await getActive(backendUrl)
      if (selected?.id === account.id) {
        throw error
      }
    }
  }
  // A refresh belongs to the identity it started with; selection can change while it is in flight.
  const current = await getActive(backendUrl)
  if (current?.id !== account.id) {
    return getAccessToken(options)
  }
  return current?.session.authAccessToken || ''
}

export const initialize = async (options: { readonly backendUrl?: string; readonly platform?: number } = {}): Promise<LoginResult> => {
  if (typeof options.platform === 'number') {
    setAuthPlatform(options.platform)
  }
  const backendUrl = await ensureMigrated(options.backendUrl)
  const registry = await accounts.read()
  const completed = await completeBrowserOidcLogin(backendUrl)
  if (completed) {
    await addSession(backendUrl, completed, registry.revision)
    return getCurrentState(backendUrl, completed.authErrorMessage)
  }
  try {
    await getAccessToken({ refresh: 'if-needed' })
    return getCurrentState(backendUrl)
  } catch (error) {
    return getCurrentState(backendUrl, error instanceof Error ? error.message : 'Unable to refresh the account.')
  }
}

export const login = async (options: LoginOptions): Promise<LoginResult> => {
  if (state.login) {
    return state.login
  }
  const operation = (async (): Promise<LoginResult> => {
    const backendUrl = await ensureMigrated(options.backendUrl)
    const registry = await accounts.read()
    const result = await handleClickLogin({ ...options, selectAccount: registry.accounts.length > 0 }, async (value) => value)
    await addSession(backendUrl, result, registry.revision)
    return getCurrentState(backendUrl, result.authErrorMessage)
  })()
  state.login = operation
  try {
    return await operation
  } finally {
    state.login = undefined
  }
}

export const useAccount = async (id: string): Promise<LoginResult> => {
  const backendUrl = await ensureMigrated()
  const registry = await accounts.read()
  if (registry.accounts.every((account) => !(account.id === id && account.backendUrl === backendUrl))) {
    throw new Error('Account is no longer available.')
  }
  await accounts.select(id)
  return getCurrentState(backendUrl)
}

export const removeAccount = async (id: string): Promise<LoginResult> => {
  const backendUrl = await ensureMigrated()
  const registry = await accounts.read()
  if (registry.accounts.some((account) => account.id === id && account.backendUrl === backendUrl)) {
    await accounts.remove(id)
  }
  return getCurrentState(backendUrl)
}

export const logout = async (): Promise<LoginResult> => {
  const backendUrl = await ensureMigrated()
  const account = await getActive(backendUrl)
  return account ? removeAccount(account.id) : getLoggedOutBackendAuthState()
}

export const syncBackendAuth = async (backendUrl: string): Promise<LoginResult> => initialize({ backendUrl })
