const millisecondsPerSecond = 1000

export const getAccessTokenExpiresAt = (expiresIn: number | undefined, now = Date.now()): number | undefined => {
  if (typeof expiresIn !== 'number' || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    return undefined
  }
  return now + expiresIn * millisecondsPerSecond
}

export const isAccessTokenValid = (accessToken: string, expiresAt: string, now = Date.now()): boolean => {
  if (!accessToken || !expiresAt) {
    return false
  }
  const expiresAtNumber = Number(expiresAt)
  return Number.isFinite(expiresAtNumber) && expiresAtNumber > now
}
