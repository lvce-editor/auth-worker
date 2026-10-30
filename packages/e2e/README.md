# Authentication end-to-end tests

Run `npm run build`, `npx playwright install chromium`, then `npm run e2e` from the repository root. CI runs the same suite through `e2e:headless` on all five platforms.

Each test starts an ephemeral localhost HTTPS provider, the built auth worker in a real Chromium worker, and the published auth-process in its supported Node worker runtime. The fixture supplies the surrounding renderer/opener shell and forwards RPC calls to auth-process; it does not replace authentication commands, fetch, token validation, or callback responses. An authorization page follows the provider redirect into auth-process's HTTP loopback listener. The provider validates the returned authorization code, client, redirect URI and PKCE verifier before issuing a token.

The suite covers successful sign-in, token endpoint 400 and 503 responses, invalid JSON, and a successful retry after each error. It verifies account/token state, persistence after worker recreation, and callback listener disposal. Every case uses its own browser context, provider port and auth-process; test cleanup closes these resources even after a failed assertion.

The checked-in localhost certificate and key are public test fixtures. Certificate errors are accepted only in the isolated Playwright context; production OAuth transport validation remains enabled. These tests exercise the native authentication transport, without depending on a full Electron installation or an external provider.
