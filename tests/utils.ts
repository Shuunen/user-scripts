 
import { expect, it } from 'vitest'

/**
 * Check if the actual value is equal to the expected value
 * @param title the title of the test
 * @param actual the actual value
 * @param expected the expected value
 * @returns nothing
 */
export function check<Type> (title: string, actual: Promise<Type> | Type, expected?: Promise<Type> | Type) {
  if (actual instanceof Promise) return it(title, async () => {
    if (expected instanceof Promise) return expect(await actual).toBe(await expected)
    return expect(await actual).toBe(expected)
  })
  return it(title, () => expect(actual).toBe(expected))
}
