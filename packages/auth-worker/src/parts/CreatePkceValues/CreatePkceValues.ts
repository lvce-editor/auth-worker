// cspell:ignore pkce

import * as oauth from 'oauth4webapi'

interface PKCEValues {
  readonly codeChallenge: string
  readonly codeVerifier: string
  readonly nonce: string
}

export const createPkceValues = async (): Promise<PKCEValues> => {
  const codeVerifier = oauth.generateRandomCodeVerifier()
  const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier)
  return {
    codeChallenge,
    codeVerifier,
    nonce: oauth.generateRandomNonce(),
  }
}
