// cspell:ignore pkce

import type * as oauth from 'oauth4webapi'
import { expect, test } from '@jest/globals'
import {
  exchangeElectronAuthorizationCode,
  type ExchangeElectronAuthorizationCodeResult,
} from '../src/parts/ExchangeElectronAuthorizationCode/ExchangeElectronAuthorizationCode.ts'

test('exchangeElectronAuthorizationCode sends the oidc token exchange and returns tokens', async () => {
  const requestCalls: Array<{
    authorizationServer: oauth.AuthorizationServer
    callbackParameters: URLSearchParams
    client: oauth.Client
    codeVerifier: string
    redirectUri: string
  }> = []
  const processCalls: Array<{
    authorizationServer: oauth.AuthorizationServer
    client: oauth.Client
    options: oauth.ProcessAuthorizationCodeResponseOptions | undefined
  }> = []
  const response = new Response('{}')
  const requestAuthorizationCodeGrant = (async (...args: readonly unknown[]) => {
    const [authorizationServer, client, _clientAuthentication, callbackParameters, redirectUri, codeVerifier] = args as Parameters<
      typeof oauth.authorizationCodeGrantRequest
    >
    requestCalls.push({
      authorizationServer,
      callbackParameters,
      client,
      codeVerifier: typeof codeVerifier === 'string' ? codeVerifier : 'pkce-disabled',
      redirectUri,
    })
    return response
  }) as typeof oauth.authorizationCodeGrantRequest
  const processAuthorizationCodeGrantResponse = (async (...args: readonly unknown[]): Promise<oauth.TokenEndpointResponse> => {
    const [authorizationServer, client, actualResponse, options] = args as Parameters<typeof oauth.processAuthorizationCodeResponse>
    expect(actualResponse).toBe(response)
    processCalls.push({ authorizationServer, client, options })
    return {
      access_token: 'access-token-1',
      refresh_token: 'refresh-token-1',
      token_type: 'bearer',
    }
  }) as typeof oauth.processAuthorizationCodeResponse

  const result = await exchangeElectronAuthorizationCode(
    'https://api.example.com/',
    'auth-code-1',
    'http://localhost:43123/callback',
    'verifier-1',
    'nonce-1',
    requestAuthorizationCodeGrant,
    processAuthorizationCodeGrantResponse,
  )

  expect(result).toEqual({
    accessToken: 'access-token-1',
    refreshToken: 'refresh-token-1',
  } satisfies ExchangeElectronAuthorizationCodeResult)
  expect(requestCalls).toEqual([
    {
      authorizationServer: {
        issuer: 'https://api.example.com/oidc',
        jwks_uri: 'https://api.example.com/oidc/jwks',
        token_endpoint: 'https://api.example.com/oidc/token',
      },
      callbackParameters: new URLSearchParams({ code: 'auth-code-1' }),
      client: {
        client_id: 'lvce-editor-native',
      },
      codeVerifier: 'verifier-1',
      redirectUri: 'http://localhost:43123/callback',
    },
  ])
  expect(processCalls).toEqual([
    {
      authorizationServer: {
        issuer: 'https://api.example.com/oidc',
        jwks_uri: 'https://api.example.com/oidc/jwks',
        token_endpoint: 'https://api.example.com/oidc/token',
      },
      client: {
        client_id: 'lvce-editor-native',
      },
      options: {
        expectedNonce: 'nonce-1',
      },
    },
  ])
})
