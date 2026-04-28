import { expect, test } from '@jest/globals'
import { createUrl } from '../src/parts/CreateUrl/CreateUrl.ts'

test('createUrl joins the base url and path', () => {
  expect(
    createUrl({
      baseUrl: 'https://api.example.com///',
      path: '/auth/login',
    }),
  ).toBe('https://api.example.com/auth/login')
})

test('createUrl appends search params', () => {
  expect(
    createUrl({
      baseUrl: 'https://api.example.com',
      params: {
        redirect_uri: 'http://localhost:3000/callback',
        state: 'abc123',
      },
      path: '/login',
    }),
  ).toBe('https://api.example.com/login?redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&state=abc123')
})