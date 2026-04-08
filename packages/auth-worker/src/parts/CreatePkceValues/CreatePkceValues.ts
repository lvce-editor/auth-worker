// cspell:ignore pkce

import * as oauth from 'oauth4webapi'

interface PKCEValues {
  readonly codeChallenge: string
  readonly codeVerifier: string
  readonly nonce: string
  readonly state: string
}

const createRandomValue = (): string => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export const createPkceValues = async (): Promise<PKCEValues> => {
  const codeVerifier = oauth.generateRandomCodeVerifier()
  const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier)
  return {
    codeChallenge,
    codeVerifier,
    nonce: createRandomValue(),
    state: createRandomValue(),
  }
}
