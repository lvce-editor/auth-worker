import { execa } from 'execa'
import { root } from './root.ts'

const main = async () => {
  execa(`npm`, ['run', 'build:watch'], {
    cwd: root,
    stdio: 'inherit',
  })
  execa(
    'node',
    ['node_modules/@lvce-editor/server/bin/server.js', '--test-path=packages/e2e', '--auth-worker-path=.tmp/dist-auth-worker/dist/authWorkerMain.js'],
    {
      cwd: root,
      stdio: 'inherit',
    },
  )
}

main()
