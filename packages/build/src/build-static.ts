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
  testPath: '',
})

const rendererWorkerPath = join(root, 'dist', commitHash, 'packages', 'renderer-worker', 'dist', 'rendererWorkerMain.js')

const content = await readFile(rendererWorkerPath, 'utf8')
const workerPath = join(root, '.tmp/dist-auth-worker/dist/authWorkerMain.js')

const occurrence = '`${assetDir}/packages/renderer-worker/node_modules/@lvce-editor/auth-worker/dist/authWorkerMain.js`'
const replacement = '`${assetDir}/packages/auth-worker/dist/authWorkerMain.js`'
if (!content.includes(occurrence)) {
  throw new Error('Could not find development auth worker URL in static renderer')
}
await writeFile(rendererWorkerPath, content.replace(occurrence, replacement))

const indexPath = join(root, 'dist', 'index.html')
const indexContent = await readFile(indexPath, 'utf8')
const indexConfigPattern = /("develop\.authWorkerPath"\s*:\s*)"[^"]*"/
if (!indexConfigPattern.test(indexContent)) {
  throw new Error('Could not find development auth worker URL in static configuration')
}
const indexReplacement = `$1"/auth-worker/${commitHash}/packages/auth-worker/dist/authWorkerMain.js"`
await writeFile(indexPath, indexContent.replace(indexConfigPattern, indexReplacement))
await cp(workerPath, join(root, 'dist', commitHash, 'packages', 'auth-worker', 'dist', 'authWorkerMain.js'))

await cp(join(root, 'dist'), join(root, '.tmp', 'static'), { recursive: true })
