import { expect, test } from '@jest/globals'
import { getEffectiveRedirectUri } from '../src/parts/GetEffectiveRedirectUri/GetEffectiveRedirectUri.ts'

test('getEffectiveRedirectUri returns explicit redirect uri when configured', async () => {
  const result = await getEffectiveRedirectUri(0, 1, 'https://configured.example.com/callback')

  expect(result).toBe('https://configured.example.com/callback')
})