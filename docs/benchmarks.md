
# Benchmarks

| date          | target | delay  | comment                      | machine         |
| ------------- | ------ | ------ | ---------------------------- | --------------- |
| 2024-06-24 #1 | eslint | 7.1 s  | before eslint-plugin-shuunen | duc w11 node 20 |
| 2024-06-24 #2 | eslint | 2.3 s  | after eslint-plugin-shuunen  | duc w11 node 20 |
| 2024-06-24    | tsc    | 1 s    |                              | duc w11 node 20 |
| 2024-06-24    | vitest | 980 ms |                              | duc w11 node 20 |

Targets :

- tsc : `hyperfine --runs 5 --warmup 3 'node node_modules/typescript/bin/tsc --noEmit'`
- eslint : `hyperfine --runs 5 --warmup 3 'node node_modules/eslint/bin/eslint'`
- vitest : `hyperfine --runs 10 --warmup 3 'npx vitest --run'`
