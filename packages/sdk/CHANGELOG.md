# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.103.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.102.0...@wundergraph/sdk@0.103.0) (2022-09-04)

### Features

* don't exit, throw error and handle at root ([#161](https://github.com/wundergraph/wundergraph/issues/161)) ([5495d27](https://github.com/wundergraph/wundergraph/commit/5495d27c181f12a96655fae0f403ffaedda50816)) (@StarpTech)

### Bug Fixes

* subscription url config ([#162](https://github.com/wundergraph/wundergraph/issues/162)) ([c503400](https://github.com/wundergraph/wundergraph/commit/c503400061a33243702c8e7be753e14d863e5d98)) (@jensneuse)

## [0.102.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.101.0...@wundergraph/sdk@0.102.0) (2022-09-02)

### Features

* refactor introspection runner ([#158](https://github.com/wundergraph/wundergraph/issues/158)) ([49d0ab3](https://github.com/wundergraph/wundergraph/commit/49d0ab3be58552e017d5120feb7f09d0f48b4aae)) (@StarpTech)

## [0.101.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.100.0...@wundergraph/sdk@0.101.0) (2022-09-01)

### Features

* implement userId for fromClaim directive ([#152](https://github.com/wundergraph/wundergraph/issues/152)) ([51df6e5](https://github.com/wundergraph/wundergraph/commit/51df6e50244bee9f5f8d579ff6f604e1a1c853d9)) (@jensneuse)

## [0.100.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.99.0...@wundergraph/sdk@0.100.0) (2022-08-30)

### Features

* **server:** introduce pino base logger ([#146](https://github.com/wundergraph/wundergraph/issues/146)) ([d261b8f](https://github.com/wundergraph/wundergraph/commit/d261b8fe5d8fa6e21058468c2e70b45defa0601a)) (@StarpTech)

### Bug Fixes

* internal directive breaks code generation ([#148](https://github.com/wundergraph/wundergraph/issues/148)) ([a9cb48c](https://github.com/wundergraph/wundergraph/commit/a9cb48cbfd840862cd38f17b9c185407acad7772)) (@jensneuse)
* **types:** make webhooks optional ([#149](https://github.com/wundergraph/wundergraph/issues/149)) ([fa0d243](https://github.com/wundergraph/wundergraph/commit/fa0d243e3bd0bfbf62448d1348709375df404cac)) (@StarpTech)

## [0.99.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.98.3...@wundergraph/sdk@0.99.0) (2022-08-29)

### Features

* use web std header implementation ([#145](https://github.com/wundergraph/wundergraph/issues/145)) ([7c0359b](https://github.com/wundergraph/wundergraph/commit/7c0359bdc3efac0a8c11ceb23cd49172a991fbd3))(@StarpTech)

## [0.98.3](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.98.2...@wundergraph/sdk@0.98.3) (2022-08-25)

**Note:** Version bump only for package @wundergraph/sdk

## [0.98.2](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.98.1...@wundergraph/sdk@0.98.2) (2022-08-25)

**Note:** Version bump only for package @wundergraph/sdk

## [0.98.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.98.0...@wundergraph/sdk@0.98.1) (2022-08-18)

**Note:** Version bump only for package @wundergraph/sdk

## [0.98.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.97.0...@wundergraph/sdk@0.98.0) (2022-08-18)

### Features

* native webhooks support ([#126](https://github.com/wundergraph/wundergraph/issues/126)) ([a0b38bd](https://github.com/wundergraph/wundergraph/commit/a0b38bd54b88198db6cc176432d577dab0931245))

### Bug Fixes

* issue with unhandled hyphens in input names ([#123](https://github.com/wundergraph/wundergraph/issues/123)) ([b01caaa](https://github.com/wundergraph/wundergraph/commit/b01caaa8c4036afbeb579dbbf14a52d82971b116))

## [0.97.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.96.1...@wundergraph/sdk@0.97.0) (2022-08-09)

### Features

* add fragment support to sdk ([5839e35](https://github.com/wundergraph/wundergraph/commit/5839e35ad4ab00f9174e8e18a54375580dd1c6a0))
* extract typescript client from nextjs ([#72](https://github.com/wundergraph/wundergraph/issues/72)) ([282797d](https://github.com/wundergraph/wundergraph/commit/282797dd4d28dce922cca8a3d5092d68c508f5bd))
* replace the legacy client with the new implementation ([#78](https://github.com/wundergraph/wundergraph/issues/78)) ([e2468c8](https://github.com/wundergraph/wundergraph/commit/e2468c8856e02a7d1d89dc1c08c1731871bc19f3))

### Bug Fixes

* update tsdoc for hooks config ([8f5d916](https://github.com/wundergraph/wundergraph/commit/8f5d9161383981e5abae2be5c66587cf2b5fb547))

## [0.96.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.96.0...@wundergraph/sdk@0.96.1) (2022-07-18)

**Note:** Version bump only for package @wundergraph/sdk

## [0.96.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.95.0...@wundergraph/sdk@0.96.0) (2022-07-13)

### Features

- use headersobject for transport hooks ([#75](https://github.com/wundergraph/wundergraph/issues/75)) ([82059cf](https://github.com/wundergraph/wundergraph/commit/82059cfb87292b3baadc8d618732314a532b5ed6))

### Bug Fixes

- **auth:** pass raw access token to hook ([#76](https://github.com/wundergraph/wundergraph/issues/76)) ([c31644d](https://github.com/wundergraph/wundergraph/commit/c31644ddcb29dcb74063ef20d80d7ef71aa3c88f))

## [0.95.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.94.4...@wundergraph/sdk@0.95.0) (2022-07-07)

### Features

- add introspection caching & DataSource polling ([#63](https://github.com/wundergraph/wundergraph/issues/63)) ([ec6226e](https://github.com/wundergraph/wundergraph/commit/ec6226e19f930d53e0a621c9a831d2ac5deea913))

### Bug Fixes

- restart hooks server, ensure \_\_wg exists ([#68](https://github.com/wundergraph/wundergraph/issues/68)) ([55435df](https://github.com/wundergraph/wundergraph/commit/55435dfcf9d03187385266bc6d6a3cc9c6606edf))

## [0.94.4](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.94.3...@wundergraph/sdk@0.94.4) (2022-07-05)

### Bug Fixes

- **codegen:** detect internal input correctly ([#64](https://github.com/wundergraph/wundergraph/issues/64)) ([7c36904](https://github.com/wundergraph/wundergraph/commit/7c36904e2d5d5a5a8c36b9c31a6f98844aa34081))

## [0.94.3](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.94.2...@wundergraph/sdk@0.94.3) (2022-06-30)

**Note:** Version bump only for package @wundergraph/sdk

## [0.94.2](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.94.1...@wundergraph/sdk@0.94.2) (2022-06-30)

### Bug Fixes

- call mutation hooks ([#58](https://github.com/wundergraph/wundergraph/issues/58)) ([8ff5f75](https://github.com/wundergraph/wundergraph/commit/8ff5f75ee50483b150a0f1b7512f9e2a2cbcba2d))

## [0.94.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.94.0...@wundergraph/sdk@0.94.1) (2022-06-30)

**Note:** Version bump only for package @wundergraph/sdk

## [0.94.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.93.2...@wundergraph/sdk@0.94.0) (2022-06-29)

### Features

- improve error message when graphql introspection fails ([#54](https://github.com/wundergraph/wundergraph/issues/54)) ([b774e73](https://github.com/wundergraph/wundergraph/commit/b774e7341bff0da2343e959854d58deab8dbf580))

### Bug Fixes

- set correct client request, remove inflights checks in client ([06df8dc](https://github.com/wundergraph/wundergraph/commit/06df8dc779702dc257545d000f0d60eb4d99a3da))

## [0.93.2](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.93.1...@wundergraph/sdk@0.93.2) (2022-06-29)

### Bug Fixes

- openapi introspection defect ([#53](https://github.com/wundergraph/wundergraph/issues/53)) ([9da07df](https://github.com/wundergraph/wundergraph/commit/9da07df6b84301ade07bbecd741aa643e06a11d4))

## [0.93.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.93.0...@wundergraph/sdk@0.93.1) (2022-06-23)

**Note:** Version bump only for package @wundergraph/sdk

## [0.93.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.92.6...@wundergraph/sdk@0.93.0) (2022-06-20)

### ⚠ BREAKING CHANGES

- **hooks:** refactor hooks interface (#40)

### Code Refactoring

- **hooks:** refactor hooks interface ([#40](https://github.com/wundergraph/wundergraph/issues/40)) ([9e58149](https://github.com/wundergraph/wundergraph/commit/9e581498899f3251cd41d6e33c784c4960979c51))

## [0.92.6](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.92.5...@wundergraph/sdk@0.92.6) (2022-06-12)

### Bug Fixes

- **hooks:** pass response correctly, pass input arg when available ([#38](https://github.com/wundergraph/wundergraph/issues/38)) ([5e4fe75](https://github.com/wundergraph/wundergraph/commit/5e4fe755a3c46446eaefbb3b5c8e581d55d608d8))

## [0.92.5](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.92.4...@wundergraph/sdk@0.92.5) (2022-06-11)

**Note:** Version bump only for package @wundergraph/sdk

## [0.92.4](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.92.3...@wundergraph/sdk@0.92.4) (2022-06-11)

**Note:** Version bump only for package @wundergraph/sdk

## [0.92.3](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.92.2...@wundergraph/sdk@0.92.3) (2022-06-11)

**Note:** Version bump only for package @wundergraph/sdk

## [0.92.2](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.92.1...@wundergraph/sdk@0.92.2) (2022-06-11)

**Note:** Version bump only for package @wundergraph/sdk

## [0.92.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.92.0...@wundergraph/sdk@0.92.1) (2022-06-10)

**Note:** Version bump only for package @wundergraph/sdk

## [0.92.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.91.5...@wundergraph/sdk@0.92.0) (2022-06-10)

### Features

- **server:** reimplement bundling, watcher, script runner ([#32](https://github.com/wundergraph/wundergraph/issues/32)) ([594af1d](https://github.com/wundergraph/wundergraph/commit/594af1d3b53c1e9b12dd21bd79a4cc8a51784c3a))

### Bug Fixes

- add test for schema merge conflict, improve error message ([#27](https://github.com/wundergraph/wundergraph/issues/27)) ([7f41a65](https://github.com/wundergraph/wundergraph/commit/7f41a651eb0975c92fb2b8fbe345fe7062c35824))

## [0.91.5](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.91.4...@wundergraph/sdk@0.91.5) (2022-06-04)

**Note:** Version bump only for package @wundergraph/sdk

## [0.91.4](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.91.3...@wundergraph/sdk@0.91.4) (2022-06-02)

**Note:** Version bump only for package @wundergraph/sdk

## 0.91.3

### Patch Changes

- [`e507ffd`](https://github.com/wundergraph/wundergraph/commit/e507ffd05916d089957b44084d8f3c5387320ef3) Thanks [@StarpTech](https://github.com/StarpTech)! - sync wunderctl version

## 0.91.2

### Patch Changes

- [`b5dbe92`](https://github.com/wundergraph/wundergraph/commit/b5dbe92e6c9d3160bfba3713c43594790cb2effd) Thanks [@StarpTech](https://github.com/StarpTech)! - sync wunderctl version

## 0.91.1

### Patch Changes

- [`d122589`](https://github.com/wundergraph/wundergraph/commit/d122589b501dfa2f6565630de4005e1bc83cc729) Thanks [@StarpTech](https://github.com/StarpTech)! - update wunderctl

## 0.91.0

### Minor Changes

- [#18](https://github.com/wundergraph/wundergraph/pull/18) [`afea237`](https://github.com/wundergraph/wundergraph/commit/afea23771191e049aab5ce56ce775775389e8770) Thanks [@StarpTech](https://github.com/StarpTech)! - move wunderctl / go binary into local node_modules

### Patch Changes

- [#20](https://github.com/wundergraph/wundergraph/pull/20) [`93cf9e1`](https://github.com/wundergraph/wundergraph/commit/93cf9e1cd3b2a30ad79d434f13f84596dd0b3607) Thanks [@jensneuse](https://github.com/jensneuse)! - fix typescript codegen for list of enum

- Updated dependencies [[`afea237`](https://github.com/wundergraph/wundergraph/commit/afea23771191e049aab5ce56ce775775389e8770)]:
  - @wundergraph/protobuf@0.91.0

## 0.90.6

### Patch Changes

- [`ad2e3a6`](https://github.com/wundergraph/wundergraph/commit/ad2e3a6fa97441b49ab477e47463a9ce2d561049) Thanks [@jensneuse](https://github.com/jensneuse)! - fix openapi transformation when array contained ref

## 0.90.5

### Patch Changes

- [`e68d101`](https://github.com/wundergraph/wundergraph/commit/e68d101f5af39918fc810c68ec0cde606009d40c) Thanks [@jensneuse](https://github.com/jensneuse)! - fix oas path resolving

## 0.90.4

### Patch Changes

- [`a53fc56`](https://github.com/wundergraph/wundergraph/commit/a53fc56a054d4b4dc68de53a8d178e3d5341ef58) Thanks [@jensneuse](https://github.com/jensneuse)! - trigger ci

## 0.90.3

### Patch Changes

- [`a27e9f5`](https://github.com/wundergraph/wundergraph/commit/a27e9f50093f7b4775f4d6a1d2f03a56398bc169) Thanks [@jensneuse](https://github.com/jensneuse)! - trigger ci

## 0.90.2

### Patch Changes

- [`7c6b3ae`](https://github.com/wundergraph/wundergraph/commit/7c6b3ae3f86bbe7ee3402556668ce81052f192f4) Thanks [@jensneuse](https://github.com/jensneuse)! - fix database introspection

## 0.90.1

### Patch Changes

- Updated dependencies [[`0857db3`](https://github.com/wundergraph/wundergraph/commit/0857db3d55209fb878fe6326629b125c6f2d2315)]:
  - @wundergraph/protobuf@0.90.1
