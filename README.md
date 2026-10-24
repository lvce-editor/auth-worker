# Auth Worker

WebWorker for the Auth functionality in Lvce Editor.

## Cloudflare account connections

`Auth.getCloudflareConnectionsUrl` returns `/cloudflare` on the configured authentication backend. `Auth.getCloudflareStatus`, `Auth.getCloudflareZones`, and `Auth.approveCloudflareMachine(id, code, zoneId)` use the current LVCE access token. Cloudflare OAuth credentials stay in backend-2. Signed-out requests fail locally. The backend needs a separately registered Cloudflare OAuth client; see [deployment setup](https://github.com/lvce-editor/backend-2/blob/main/docs/cloudflare.md).
