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
    client: oauth.Client
    grantType: string
    parameters: URLSearchParams
  }> = []
  const processCalls: Array<{
    authorizationServer: oauth.AuthorizationServer
    client: oauth.Client
  }> = []
  const response = new Response('{}')
  const requestTokenEndpoint = (async (...args: readonly unknown[]) => {
    const [authorizationServer, client, _clientAuthentication, grantType, parameters] = args as Parameters<typeof oauth.genericTokenEndpointRequest>
    requestCalls.push({
      authorizationServer,
      client,
      grantType,
      parameters: parameters instanceof URLSearchParams ? parameters : new URLSearchParams(parameters),
    })
    return response
  }) as typeof oauth.genericTokenEndpointRequest
  const processTokenEndpointResponse = (async (...args: readonly unknown[]): Promise<oauth.TokenEndpointResponse> => {
    const [authorizationServer, client, actualResponse] = args as Parameters<typeof oauth.processGenericTokenEndpointResponse>
    expect(actualResponse).toBe(response)
    processCalls.push({ authorizationServer, client })
    return {
      access_token: 'access-token-1',
      refresh_token: 'refresh-token-1',
      token_type: 'bearer',
    }
  }) as typeof oauth.processGenericTokenEndpointResponse

  const result = await exchangeElectronAuthorizationCode(
    'https://api.example.com/',
    'auth-code-1',
    'http://localhost:43123/callback',
    'verifier-1',
    requestTokenEndpoint,
    processTokenEndpointResponse,
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
      client: {
        client_id: 'lvce-editor-native',
      },
      grantType: 'authorization_code',
      parameters: new URLSearchParams({
        code: 'auth-code-1',
        code_verifier: 'verifier-1',
        redirect_uri: 'http://localhost:43123/callback',
      }),
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
    },
  ])
})
