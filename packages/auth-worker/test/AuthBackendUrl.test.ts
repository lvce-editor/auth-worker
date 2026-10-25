import { afterEach, expect, test } from '@jest/globals'
import { setAuthBackendUrl } from '../src/parts/AuthBackendUrl/AuthBackendUrl.ts'
import { commandMap } from '../src/parts/CommandMap/CommandMap.ts'

afterEach(() => setAuthBackendUrl(''))

test('the generic backend query follows authentication configuration, including before sign-in', () => {
  expect(commandMap['Auth.getBackendUrl']()).toBe('')
  setAuthBackendUrl('https://first.test')
  expect(commandMap['Auth.getBackendUrl']()).toBe('https://first.test')
  setAuthBackendUrl('https://second.test')
  expect(commandMap['Auth.getBackendUrl']()).toBe('https://second.test')
})
