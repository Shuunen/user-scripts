import { defineConfig } from 'vitest/config'

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
  test: {
    coverage: {
      exclude: ['src/*.types.ts', 'src/bin/**', '*.config.ts'],
      include: ['src'],
      provider: 'v8' as const,
    },
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    reporters: ['dot'],
    silent: true,
  },
})
