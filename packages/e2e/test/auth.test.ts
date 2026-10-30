/* eslint-disable e2e/no-imports -- Node orchestrates real browser and provider processes rather than an in-app test module. */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { build } from 'esbuild'
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { once } from 'node:events'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:https'
import { createRequire } from 'node:module'
import { test, type TestContext } from 'node:test'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const require = createRequire(import.meta.url)
const worker = await readFile(new URL('../../../.tmp/dist-auth-worker/dist/authWorkerMain.js', import.meta.url))
const shell = await build({
  bundle: true,
  entryPoints: [fileURLToPath(new URL('../fixtures/shell.ts', import.meta.url))],
  external: ['node:*', 'electron', 'ws'],
  format: 'esm',
  platform: 'browser',
  write: false,
})
const key = await readFile(new URL('../fixtures/localhost-key.pem', import.meta.url))
const cert = await readFile(new URL('../fixtures/localhost-cert.pem', import.meta.url))

const RE_CALLBACK = /^http:\/\/localhost:\d+\/callback\?code=/

for (const failure of ['none', '400', '503', 'invalid-json']) {
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- TestContext contains mutable runner-owned state.
  await test(`native sign-in with provider response ${failure}`, { timeout: 30_000 }, async (t: Readonly<TestContext>) => {
    let responseMode = failure
    const requests: string[] = []
    const grants = new Map<string, { challenge: string; redirectUri: string }>()
    const callbacks: string[] = []
    const providerErrors: unknown[] = []
    const accessToken = `access-${randomUUID()}`
    // The handler catches and reports errors to the assertions below.
    // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/prefer-readonly-parameter-types -- Node owns mutable HTTP request/response state.
    const server = createServer({ cert, key }, async (request: Readonly<IncomingMessage>, response: Readonly<ServerResponse>) => {
      try {
        const url = new URL(request.url!, 'https://localhost')
        requests.push(`${request.method} ${url.pathname}`)
        response.setHeader('Content-Type', 'application/json')
        switch (url.pathname) {
          case '/':
            response.setHeader('Content-Type', 'text/html')
            response.end('<!doctype html><script type="module" src="/shell.js"></script>')
            return
          case '/account/me':
            assert.equal(request.headers.authorization, `Bearer ${accessToken}`)
            response.end(JSON.stringify({ displayName: 'Test Account', email: 'test@example.com', id: 'test-user', provider: 'Local Test' }))
            return
          case '/authWorkerMain.js':
            response.setHeader('Content-Type', 'text/javascript')
            response.end(worker)
            return
          case '/oidc/auth': {
            assert.equal(url.searchParams.get('client_id'), 'lvce-editor-native')
            assert.equal(url.searchParams.get('response_type'), 'code')
            assert.equal(url.searchParams.get('code_challenge_method'), 'S256')
            assert.ok(url.searchParams.get('state'))
            const redirectUri = url.searchParams.get('redirect_uri')!
            const callback = new URL(redirectUri)
            assert.equal(callback.protocol, 'http:')
            assert.equal(callback.hostname, 'localhost')
            assert.equal(callback.pathname, '/callback')
            assert.ok(Number(callback.port) > 0)
            callbacks.push(redirectUri)
            const code = randomUUID()
            grants.set(code, { challenge: url.searchParams.get('code_challenge')!, redirectUri })
            callback.searchParams.set('code', code)
            callback.searchParams.set('state', url.searchParams.get('state')!)
            response.writeHead(302, { Location: callback.href })
            response.end()
            return
          }
          case '/oidc/token': {
            assert.equal(request.method, 'POST')
            let body = ''
            for await (const chunk of request) {
              body += chunk
            }
            const params = new URLSearchParams(body)
            const grant = grants.get(params.get('code')!)
            assert.ok(grant, 'the token exchange must use the code sent through the real callback listener')
            grants.delete(params.get('code')!)
            assert.equal(params.get('grant_type'), 'authorization_code')
            assert.equal(params.get('client_id'), 'lvce-editor-native')
            assert.equal(params.get('redirect_uri'), grant.redirectUri)
            assert.equal(createHash('sha256').update(params.get('code_verifier')!).digest('base64url'), grant.challenge)
            if (responseMode === '400' || responseMode === '503') {
              response.writeHead(Number(responseMode))
              response.end(JSON.stringify({ error: 'invalid_grant', error_description: 'Test provider rejected the exchange' }))
            } else if (responseMode === 'invalid-json') {
              response.end('{invalid json')
            } else {
              response.end(JSON.stringify({ access_token: accessToken, expires_in: 3600, refresh_token: 'refresh-token', token_type: 'Bearer' }))
            }
            return
          }
          case '/shell.js':
            response.setHeader('Content-Type', 'text/javascript')
            response.end(shell.outputFiles[0].contents)
            return
          default:
            response.writeHead(404)
            response.end('{}')
        }
      } catch (error) {
        providerErrors.push(error)
        response.writeHead(500)
        response.end('{}')
      }
    })
    t.after(async () => {
      server.closeAllConnections()
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
    })
    server.listen(0, 'localhost')
    await once(server, 'listening')
    const address = server.address()
    assert.ok(address && typeof address !== 'string')
    const backendUrl = `https://localhost:${address.port}`
    const authProcess = await NodeWorkerRpcParent.create({
      argv: ['--ipc-type=node-worker'],
      commandMap: {},
      path: require.resolve('@lvce-editor/auth-process'),
    })
    t.after(() => authProcess.dispose())
    const browser = await chromium.launch({ headless: true })
    t.after(() => browser.close())
    const context = await browser.newContext({ ignoreHTTPSErrors: true })
    const page = await context.newPage()
    page.setDefaultTimeout(10_000)
    await page.exposeFunction('authProcessCommand', (method: string, ...params: readonly unknown[]) => authProcess.invoke(method, ...params))
    await page.exposeFunction('openAuthorizationUrl', async (url: string) => {
      const authorization = await context.newPage()
      try {
        await authorization.goto(url, { timeout: 10_000 })
        assert.match(authorization.url(), RE_CALLBACK)
        const body = await authorization.locator('body').textContent()
        assert.ok(body?.includes('successfully'))
      } finally {
        await authorization.close()
      }
    })
    await page.goto(backendUrl)
    await page.waitForFunction(() => globalThis.auth !== undefined)
    const login = (): Promise<Record<string, unknown>> =>
      page.evaluate((url) => globalThis.auth!.invoke('Auth.login', { backendUrl: url, platform: 1 }), backendUrl)
    if (failure !== 'none') {
      const failed = await login()
      assert.equal(failed.userState, 'loggedOut')
      assert.ok(failed.authErrorMessage)
      assert.equal(await page.evaluate(() => globalThis.auth!.invoke('Auth.getAccessToken')), '')
      assert.deepEqual(await page.evaluate(() => globalThis.auth!.invoke('Auth.getAccounts')), [])
      assert.equal(requests.filter((request) => request === 'POST /oidc/token').length, 1)
      assert.equal(requests.includes('GET /account/me'), false)
      await assert.rejects(fetch(callbacks[0], { signal: AbortSignal.timeout(2000) }), 'failed login must close its callback listener')
      responseMode = 'none'
    }
    const result = await login()
    assert.equal(result.userState, 'loggedIn')
    assert.equal(result.authErrorMessage, '')
    assert.equal(result.userName, 'Test Account')
    assert.equal(result.authAccessToken, accessToken)
    assert.equal(await page.evaluate(() => globalThis.auth!.invoke('Auth.getAccessToken')), accessToken)
    const accounts = await page.evaluate(() => globalThis.auth!.invoke('Auth.getAccounts'))
    assert.equal(accounts.length, 1)
    assert.equal(accounts[0].id, `${backendUrl}/test-user`)
    assert.equal(accounts[0].active, true)
    assert.equal(accounts[0].signedIn, true)
    assert.equal(grants.size, 0)
    assert.deepEqual(providerErrors, [])
    assert.equal(callbacks.length, failure === 'none' ? 1 : 2)
    await assert.rejects(fetch(callbacks.at(-1)!, { signal: AbortSignal.timeout(2000) }), 'successful login must close its callback listener')
    // Recreating the worker verifies account/token persistence in the isolated browser profile.
    await page.reload()
    await page.waitForFunction(() => globalThis.auth !== undefined)
    const restored = await page.evaluate(() => globalThis.auth!.invoke('Auth.initialize'))
    assert.equal(restored.userState, 'loggedIn')
    assert.equal(await page.evaluate(() => globalThis.auth!.invoke('Auth.getAccessToken')), accessToken)
  })
}
