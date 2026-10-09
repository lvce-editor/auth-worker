import { readFile, readdir, writeFile } from 'node:fs/promises'

import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const root = join(__dirname, '..', '..', '..')

export const getRemoteUrl = (path) => {
  const url = pathToFileURL(path).toString().slice(8)
  return `/remote/${url}`
}

const nodeModulesPath = join(root, 'node_modules')

const serverStaticPath = join(nodeModulesPath, '@lvce-editor', 'static-server', 'static')

const RE_COMMIT_HASH = /^[a-z\d]+$/
const isCommitHash = (dirent) => {
  return dirent.length === 7 && dirent.match(RE_COMMIT_HASH)
}

const dirents = await readdir(serverStaticPath)
const commitHash = dirents.find(isCommitHash) || ''
const rendererWorkerMainPath = join(serverStaticPath, commitHash, 'packages', 'renderer-worker', 'dist', 'rendererWorkerMain.js')

const workerPath = join(root, '.tmp/dist-auth-worker/dist/authWorkerMain.js')
const remoteUrl = getRemoteUrl(workerPath)

const replace = async (path, occurrence, replacement) => {
  const content = await readFile(path, 'utf8')
  if (content.includes(replacement)) {
    return
  }
  if (!content.includes(occurrence)) {
    throw new Error(`Could not find expected auth worker URL in ${path}`)
  }
  await writeFile(path, content.replace(occurrence, replacement))
}

await replace(
  rendererWorkerMainPath,
  '`${assetDir}/packages/renderer-worker/node_modules/@lvce-editor/auth-worker/dist/authWorkerMain.js`',
  `\`${remoteUrl}\``,
)
await replace(
  join(serverStaticPath, 'index.html'),
  `"develop.authWorkerPath": "/${commitHash}/packages/auth-worker/dist/authWorkerMain.js"`,
  `"develop.authWorkerPath": "${remoteUrl}"`,
)
