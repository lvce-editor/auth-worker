import { expect, test } from '@jest/globals'
import { isObject } from '../src/parts/IsObject/IsObject.ts'

test('isObject only accepts non-null objects', () => {
  expect(isObject({ ok: true })).toBe(true)
  expect(isObject([])).toBe(true)
  expect(isObject(null)).toBe(false)
  expect(isObject('value')).toBe(false)
})