// cspell:ignore pkce

interface PKCEValues {
  readonly codeChallenge: string
  readonly codeVerifier: string
  readonly nonce: string
  readonly state: string
}

const base64UrlEncode = (value: Uint8Array): string => {
  let binary = ''
  for (const byte of value) {
    binary += String.fromCodePoint(byte)
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

const getCrypto = (): Crypto => {
  if (!globalThis.crypto) {
    throw new Error('Crypto API is unavailable.')
  }
  return globalThis.crypto
}

const createRandomValue = (byteLength: number): string => {
  const bytes = new Uint8Array(byteLength)
  getCrypto().getRandomValues(bytes)
  return base64UrlEncode(bytes)
}

const sha256 = async (value: string): Promise<Uint8Array> => {
  const digest = await getCrypto().subtle.digest('SHA-256', new TextEncoder().encode(value))
  return new Uint8Array(digest)
}

export const createPkceValues = async (): Promise<PKCEValues> => {
  const codeVerifier = createRandomValue(32)
  const codeChallenge = base64UrlEncode(await sha256(codeVerifier))
  return {
    codeChallenge,
    codeVerifier,
    nonce: createRandomValue(16),
    state: createRandomValue(16),
  }
}
