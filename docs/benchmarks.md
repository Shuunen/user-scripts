
# Benchmarks

| date          | target | delay  | comment                       | machine            |
| ------------- | ------ | ------ | ----------------------------- | ------------------ |
| 2024-06-24    | tsc    | 1.0 s  |                               | duc w11 node 20    |
| 2024-06-24    | vitest | 980 ms |                               | duc w11 node 20    |
| 2024-06-24 #1 | eslint | 7.1 s  | before eslint-plugin-shuunen  | duc w11 node 20    |
| 2024-06-24 #2 | eslint | 2.3 s  | after eslint-plugin-shuunen   | duc w11 node 20    |
| 2024-07-07    | eslint | 3.3 s  | after eslint-plugin-shuunen   | gram zorin node 20 |
| 2024-07-07    | tsc    | 1.3 s  |                               | gram zorin node 20 |
| 2024-07-07    | vitest | 1.3 s  |                               | gram zorin node 20 |
| 2025-05-05    | eslint | 3.6 s  | eslint-plugin-shuunen cjs 0.4 | duc w11 node 22.14 |
| 2025-05-05    | eslint | 2.4 s  | eslint-plugin-shuunen esm 1.3 | duc w11 node 22.14 |

Targets :

- tsc : `hyperfine --runs 5 --warmup 3 'node node_modules/typescript/bin/tsc --noEmit'`
- eslint : `hyperfine --runs 5 --warmup 3 'node node_modules/eslint/bin/eslint'`
- vitest : `hyperfine --runs 10 --warmup 3 'npx vitest --run'`

Note 1 : to show time taken by rules : `TIMING=1 npx eslint`

Note 2 : to view final config : `npx eslint --print-config tailwind.config.js > eslint-js.config.json`

Note 3 : to list eslint scanned files : `npx eslint --debug 2>&1 | grep eslint:eslint | awk '{print $NF}'`
