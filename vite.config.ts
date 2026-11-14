import { defineConfig } from 'vitest/config'

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
  build: { reportCompressedSize: false },
  test: {
    coverage: {
      exclude: ['src/*.types.ts', 'src/*.d.ts', 'src/*.jpg', 'src/*.css', 'src/bin/**', '*.config.ts'],
      include: ['src'],
      provider: 'v8' as const,
      thresholds: {
        100: true,
      },
    },
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    reporters: ['dot'],
    silent: true,
  },
})
