// Global type declarations for userscript dependencies

/**
 * Shuutils class that's globally available through userscript @require directive
 * Uses the same class definition as the local utils.js file
 * @see utils.js
 */
declare const Shuutils: typeof import('./utils.js').Shuutils

/**
 * RoughNotation library that's globally available through userscript @require directive
 * Uses types from the installed rough-notation package
 * @see https://unpkg.com/rough-notation/lib/rough-notation.iife.js
 */
declare const RoughNotation: typeof import('rough-notation')

declare const idbKeyval: {
  get: <Type>(key: string) => Promise<Type>
  set: (key: string, value: unknown) => Promise<void>
  clear: () => Promise<void>
}

declare const tailwind: {
  config: Record<string, unknown>
}

declare const Appwrite: typeof import('appwrite')
