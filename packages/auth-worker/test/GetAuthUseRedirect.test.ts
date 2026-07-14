import { expect, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
import { getAuthUseRedirect } from '../src/parts/GetAuthUseRedirect/GetAuthUseRedirect.ts'

test('getAuthUseRedirect uses the current window on the web', () => {
  expect(getAuthUseRedirect(PlatformType.Web)).toBe(true)
})

test('getAuthUseRedirect opens a separate window in Electron', () => {
  expect(getAuthUseRedirect(PlatformType.Electron)).toBe(false)
})
