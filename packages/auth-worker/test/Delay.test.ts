import { expect, test } from '@jest/globals'
import { delay } from '../src/parts/Delay/Delay.ts'

test('delay resolves after waiting', async () => {
  await expect(delay(0)).resolves.toBeUndefined()
})