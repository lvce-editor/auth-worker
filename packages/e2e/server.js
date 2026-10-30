import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)))
process.argv.push(`--auth-worker-path=${resolve(root, '.tmp/dist-auth-worker/dist/authWorkerMain.js')}`)

await import('../../node_modules/@lvce-editor/server/bin/server.js')
