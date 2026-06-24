import { trimTrailingSlashes } from '../TrimTrailingSlashes/TrimTrailingSlashes.ts'

export interface CreateUrlOptions {
  readonly baseUrl: string
  readonly params?: Readonly<Record<string, string>>
  readonly path: string
}

export const createUrl = (options: CreateUrlOptions): string => {
  const { baseUrl, params = {}, path } = options
  const url = new URL(`${trimTrailingSlashes(baseUrl)}${path}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return url.href
}
