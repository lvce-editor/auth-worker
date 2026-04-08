let storedRefreshToken = ''

export const clearStoredRefreshToken = (): void => {
  storedRefreshToken = ''
}

export const getStoredRefreshToken = (): string => {
  return storedRefreshToken
}

export const setStoredRefreshToken = (value: string): void => {
  storedRefreshToken = value
}
