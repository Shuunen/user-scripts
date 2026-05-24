# Changelog

## [2.6.6] - 2026-05-24

### Changed

- Updates from monorepo: migrate tests to TypeScript, add internal lint tooling (`src/bin/lint.cli.ts`, `src/bin/lint.rules.ts`), refactor scripts to named PascalCase functions ([7e0f52c](https://github.com/Shuunen/user-scripts/commit/7e0f52cbcbf87f7fa0fa91e12f091f9d12c9868e))
- Update dependencies: typescript ~6.0.3, vite ^8.0.14, vitest ^4.1.7, turbo ^2.9.14, oxlint ^1.66.0 ([f843ab1](https://github.com/Shuunen/user-scripts/commit/f843ab124a90714ae3f5066abfe140df9955b23b))
- Update CI workflow: actions/checkout@v6, actions/setup-node@v6, pnpm/action-setup@v6, Node 24 ([f4949fc](https://github.com/Shuunen/user-scripts/commit/f4949fc2b63f54137ecd928ff768a05256ef4b14))
- Add `bun` to `onlyBuiltDependencies` in `pnpm-workspace.yaml` ([ad8841e](https://github.com/Shuunen/user-scripts/commit/ad8841e80f66206a4b5a6945d6c58f0727940232))
