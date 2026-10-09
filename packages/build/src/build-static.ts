import { cp, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { root } from './root.ts'

const sharedProcessPath = join(root, 'node_modules', '@lvce-editor', 'shared-process', 'index.js')

const sharedProcessUrl = pathToFileURL(sharedProcessPath).toString()

const sharedProcess = await import(sharedProcessUrl)

process.env.PATH_PREFIX = '/auth-worker'
const { commitHash } = await sharedProcess.exportStatic({
  root,
  extensionPath: '',
  testPath: 'packages/e2e',
})

const rendererWorkerPath = join(root, 'dist', commitHash, 'packages', 'renderer-worker', 'dist', 'rendererWorkerMain.js')

export const getRemoteUrl = (path: string): string => {
  const url = pathToFileURL(path).toString().slice(8)
  return `/remote/${url}`
}

const content = await readFile(rendererWorkerPath, 'utf8')
const workerPath = join(root, '.tmp/dist-auth-worker/dist/authWorkerMain.js')

const remoteUrl = getRemoteUrl(workerPath)
const occurrence = `\`${remoteUrl}\``
const replacement = '`${assetDir}/packages/auth-worker/dist/authWorkerMain.js`'
if (!content.includes(occurrence)) {
  throw new Error('Could not find development auth worker URL in static renderer')
}
await writeFile(rendererWorkerPath, content.replace(occurrence, replacement))

const indexPath = join(root, 'dist', 'index.html')
const indexContent = await readFile(indexPath, 'utf8')
const indexOccurrence = `"develop.authWorkerPath": "${remoteUrl}"`
const indexReplacement = `"develop.authWorkerPath": "/auth-worker/${commitHash}/packages/auth-worker/dist/authWorkerMain.js"`
if (!indexContent.includes(indexOccurrence)) {
  throw new Error('Could not find development auth worker URL in static configuration')
}
await writeFile(indexPath, indexContent.replace(indexOccurrence, indexReplacement))
await cp(workerPath, join(root, 'dist', commitHash, 'packages', 'auth-worker', 'dist', 'authWorkerMain.js'))

await cp(join(root, 'dist'), join(root, '.tmp', 'static'), { recursive: true })
