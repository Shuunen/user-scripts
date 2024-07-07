
import { expect, it } from 'vitest'

/**
 * Check if the actual value is equal to the expected value
 * @param {string} title the title of the test
 * @param {Promise<Function> | string | number} actual the actual value
 * @param {Promise<Function> | string | number} expected the expected value
 * @returns {void}
 */
export function check (title, actual, expected) {
  if (actual instanceof Promise) return it(title, async () => {
    if (expected instanceof Promise) return expect(await actual).toBe(await expected)
    return expect(await actual).toBe(expected)
  })
  return it(title, () => expect(actual).toBe(expected))
}
