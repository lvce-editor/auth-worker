import { expect, test } from '@jest/globals'
import { getEffectiveRedirectUri } from '../src/parts/GetEffectiveRedirectUri/GetEffectiveRedirectUri.ts'

const originalLocation = globalThis.location

const setLocationHref = (href: string): void => {
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: {
      href,
    },
  })
}

const restoreLocation = (): void => {
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: originalLocation,
  })
}

test('getEffectiveRedirectUri returns explicit redirect uri when configured', async () => {
  const result = await getEffectiveRedirectUri(0, 1, 'https://configured.example.com/callback')

  expect(result).toBe('https://configured.example.com/callback')
})

test('getEffectiveRedirectUri keeps electron callback path redirects', async () => {
  const result = await getEffectiveRedirectUri(0, 1, 'http://localhost:43123/callback')

  expect(result).toBe('http://localhost:43123/callback')
})

test('getEffectiveRedirectUri uses the current origin for standard web urls', async () => {
  setLocationHref('https://example.com/editor')

  try {
    const result = await getEffectiveRedirectUri(0, 1, '')

    expect(result).toBe('https://example.com/auth/callback')
  } finally {
    restoreLocation()
  }
})

test('getEffectiveRedirectUri keeps the repository prefix on github pages', async () => {
  setLocationHref('https://lvce-editor.github.io/lvce-editor/oidc')

  try {
    const result = await getEffectiveRedirectUri(0, 1, '')

    expect(result).toBe('https://lvce-editor.github.io/lvce-editor/auth/callback')
  } finally {
    restoreLocation()
  }
})
