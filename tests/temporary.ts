/* eslint-disable @typescript-eslint/no-confusing-void-expression */
/* eslint-disable filenames/match-regex */
import { test } from 'uvu'
import { equal } from 'uvu/assert'

/**
 * Check if the actual value is equal to the expected value
 * @param title the title of the test
 * @param actual the actual value
 * @param expected the expected value
 * @returns nothing
 */
export function check<Type> (title: string, actual: Promise<Type> | Type, expected?: Promise<Type> | Type) {
  if (actual instanceof Promise) return test(title, async () => {
    if (expected instanceof Promise) return equal(await actual, await expected)
    return equal(await actual, expected)
  })
  return test(title, () => equal(actual, expected))
}

/**
 * Run all the tests declared in the file
 */
export function checksRun () {
  test.run()
}
