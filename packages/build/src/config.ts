import { join } from 'node:path'
import { root } from './root.ts'

export const threshold = 520_000

export const instantiations = 200_000

export const instantiationsPath = join(root, 'packages', 'auth-worker')

export const workerPath = join(root, '.tmp/dist-auth-worker/dist/authWorkerMain.js')

export const playwrightPath = new URL('../../e2e/node_modules/playwright/index.mjs', import.meta.url).toString()
