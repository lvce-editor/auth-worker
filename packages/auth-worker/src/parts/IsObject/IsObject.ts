export const isObject = (value: unknown): value is Record<string, unknown> => {
  return !!value && typeof value === 'object'
}
