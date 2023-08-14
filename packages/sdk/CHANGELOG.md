# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.174.3](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.174.2...@wundergraph/sdk@0.174.3) (2023-08-14)

### Bug Fixes

* server logger missing cloud env bindings ([#1191](https://github.com/wundergraph/wundergraph/issues/1191)) ([885ffe3](https://github.com/wundergraph/wundergraph/commit/885ffe38ae799ace0f190aa9178d192722f7df5c)) (@thisisnithin)
* type error in generated jsonschema.ts file ([#1190](https://github.com/wundergraph/wundergraph/issues/1190)) ([979f215](https://github.com/wundergraph/wundergraph/commit/979f215b1484ae479e0beecbd83e771633625b20)) (@thisisnithin)

## [0.174.2](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.174.1...@wundergraph/sdk@0.174.2) (2023-08-13)

### Bug Fixes

* **mock-library:** ensure to read req body only once ([#1188](https://github.com/wundergraph/wundergraph/issues/1188)) ([76c8b36](https://github.com/wundergraph/wundergraph/commit/76c8b364d19f69956faf33cbc11ed01fd0628cbd)) (@StarpTech)

## [0.174.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.174.0...@wundergraph/sdk@0.174.1) (2023-08-03)

**Note:** Version bump only for package @wundergraph/sdk

## [0.174.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.173.0...@wundergraph/sdk@0.174.0) (2023-08-03)

### Features

* add support for renaming root field response types ([#1173](https://github.com/wundergraph/wundergraph/issues/1173)) ([f7734ce](https://github.com/wundergraph/wundergraph/commit/f7734ce9cc2637bf0264792192ff5bf75dc2a978)) (@Aenimus)

## [0.173.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.172.0...@wundergraph/sdk@0.173.0) (2023-08-02)

### Features

* implement schema extension and replaceCustomScalarTypeFields fo… ([#1169](https://github.com/wundergraph/wundergraph/issues/1169)) ([7e17b9a](https://github.com/wundergraph/wundergraph/commit/7e17b9a96a50266a9a860e2f46e992e26665df2b)) (@Aenimus)

## [0.172.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.171.0...@wundergraph/sdk@0.172.0) (2023-08-01)

### Features

* improve support for BigInt ([#1165](https://github.com/wundergraph/wundergraph/issues/1165)) ([32fbcde](https://github.com/wundergraph/wundergraph/commit/32fbcde4b042e5da8dbfc672259d193904f9cf51)) (@fiam)

### Bug Fixes

* nats subscriptions ([#1155](https://github.com/wundergraph/wundergraph/issues/1155)) ([3c66c77](https://github.com/wundergraph/wundergraph/commit/3c66c77276b344288f7b35943b8d004fd67055a8)) (@jensneuse)

## [0.171.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.170.1...@wundergraph/sdk@0.171.0) (2023-07-28)

### Features

* enable log messages when parsing OpenAPI specs ([#1154](https://github.com/wundergraph/wundergraph/issues/1154)) ([29c5acd](https://github.com/wundergraph/wundergraph/commit/29c5acd911de32f476a1506e2e96a467ab45e93d)) (@fiam)
* unify authentication mechanisms, redirect back with errors ([#1059](https://github.com/wundergraph/wundergraph/issues/1059)) ([71d88b3](https://github.com/wundergraph/wundergraph/commit/71d88b3ca5157ad35e909d70dec9dcf4f9c2fe58)) (@fiam)

### Bug Fixes

* allow TS operations to override a requiredAuthentication with false ([#1151](https://github.com/wundergraph/wundergraph/issues/1151)) ([a6017cd](https://github.com/wundergraph/wundergraph/commit/a6017cd39f3c62ed0d658ac44495a0078be28691)) (@fiam)

## [0.170.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.170.0...@wundergraph/sdk@0.170.1) (2023-07-24)

### Bug Fixes

* peer dependency warnings ([#1143](https://github.com/wundergraph/wundergraph/issues/1143)) ([1f9bec2](https://github.com/wundergraph/wundergraph/commit/1f9bec236179322697c20124e53615c8976d96e5)) (@Pagebakers)

## [0.170.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.169.0...@wundergraph/sdk@0.170.0) (2023-07-24)

### Features

* advanced hooks - dynamicTransport ([#1124](https://github.com/wundergraph/wundergraph/issues/1124)) ([6cbdeba](https://github.com/wundergraph/wundergraph/commit/6cbdebac0a775b638beeae8457d07dce829379bc)) (@Pagebakers)
* initial impl of nats kv ([#1057](https://github.com/wundergraph/wundergraph/issues/1057)) ([961f1f0](https://github.com/wundergraph/wundergraph/commit/961f1f0d14b95fc69a9a99ef637d6cd544750c08)) (@jensneuse)
* unify pretty logs ([#1139](https://github.com/wundergraph/wundergraph/issues/1139)) ([c765d1f](https://github.com/wundergraph/wundergraph/commit/c765d1fca829953383c5be55e1a5348ad62d7c0a)) (@fiam)
* upgrade to typescript 5 ([#1135](https://github.com/wundergraph/wundergraph/issues/1135)) ([74cee5d](https://github.com/wundergraph/wundergraph/commit/74cee5db3ae8865d2bf1f1d7ab5c67fccbeeb798)) (@Pagebakers)

### Bug Fixes

* add cloudflare worker support for client ([#1137](https://github.com/wundergraph/wundergraph/issues/1137)) ([af6a18a](https://github.com/wundergraph/wundergraph/commit/af6a18a0e28f59fc69d6fc131431d6882ff57415)) (@Pagebakers)
* move codegen template helpers out of internal ([#1136](https://github.com/wundergraph/wundergraph/issues/1136)) ([3fd393f](https://github.com/wundergraph/wundergraph/commit/3fd393f777ea92ba69b48a1a8502aca5b2e6ed48)) (@Pagebakers)

## [0.169.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.168.0...@wundergraph/sdk@0.169.0) (2023-07-14)

### Features

* improve openai ([#1126](https://github.com/wundergraph/wundergraph/issues/1126)) ([31c9449](https://github.com/wundergraph/wundergraph/commit/31c94497c483ebb7fdcf32dc7f74e919cf39eb6e)) (@jensneuse)

### Bug Fixes

* make errors in wunderctl and prisma introspection more visible ([#1122](https://github.com/wundergraph/wundergraph/issues/1122)) ([f7474cd](https://github.com/wundergraph/wundergraph/commit/f7474cd1be8adfde6ef39750a90c0aeca3d3da97)) (@fiam)

## [0.168.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.167.1...@wundergraph/sdk@0.168.0) (2023-07-13)

### Features

* add support for feature usage telemetry ([#1096](https://github.com/wundergraph/wundergraph/issues/1096)) ([30a0b12](https://github.com/wundergraph/wundergraph/commit/30a0b129899d8296aa6a027d1ecafde469a0ead2)) (@fiam)
* add support for openai ([#1121](https://github.com/wundergraph/wundergraph/issues/1121)) ([146ae11](https://github.com/wundergraph/wundergraph/commit/146ae11ef85ecb3691833115060fc2244daf1667)) (@fiam)

## [0.167.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.167.0...@wundergraph/sdk@0.167.1) (2023-07-06)

### Bug Fixes

* customJSONScalars are ignored when introspection is fetched from cache ([#1110](https://github.com/wundergraph/wundergraph/issues/1110)) ([47deeb9](https://github.com/wundergraph/wundergraph/commit/47deeb91ae37cd5a2cbf97ff05edf8afac5c64b4)) (@fiam)

## [0.167.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.166.1...@wundergraph/sdk@0.167.0) (2023-07-05)

### Features

* reimplement customJSONScalars ([#1099](https://github.com/wundergraph/wundergraph/issues/1099)) ([a5d49cb](https://github.com/wundergraph/wundergraph/commit/a5d49cbff29afb00d39d6d938800fc800faf139d)) (@Aenimus)
* support different types with the same when generating OAS ([#1103](https://github.com/wundergraph/wundergraph/issues/1103)) ([dd4aaca](https://github.com/wundergraph/wundergraph/commit/dd4aaca3d10f327de3cd4db07d672f41e4f76c94)) (@fiam)

## [0.166.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.166.0...@wundergraph/sdk@0.166.1) (2023-06-22)

### Bug Fixes

* delete unknown directives from the schema generated from OAS ([#1086](https://github.com/wundergraph/wundergraph/issues/1086)) ([938e7ed](https://github.com/wundergraph/wundergraph/commit/938e7edf02fb8a28cd95d550387ca69fe489f33e)), closes [#1083](https://github.com/wundergraph/wundergraph/issues/1083) (@fiam)
* federation introspection ([#1073](https://github.com/wundergraph/wundergraph/issues/1073)) ([12c9307](https://github.com/wundergraph/wundergraph/commit/12c9307750c968082e1798dbd3d8ca5af9d668a0)) (@devsergiy)

## [0.166.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.165.0...@wundergraph/sdk@0.166.0) (2023-06-21)

### Features

* use 204 to signal there's no authenticated user ([#1063](https://github.com/wundergraph/wundergraph/issues/1063)) ([7821a5c](https://github.com/wundergraph/wundergraph/commit/7821a5cee15817c854d614250892990221328464)) (@fiam)

### Bug Fixes

* produce JSONPatch patches with removals in the right order ([#1060](https://github.com/wundergraph/wundergraph/issues/1060)) ([461b6a4](https://github.com/wundergraph/wundergraph/commit/461b6a446a59f3b81e01a1840f151f716e138416)) (@fiam)
* update [@ominigrah](https://github.com/ominigrah) / [@graph-mesh](https://github.com/graph-mesh) dependencies to fix security warning ([#1055](https://github.com/wundergraph/wundergraph/issues/1055)) ([c1184a2](https://github.com/wundergraph/wundergraph/commit/c1184a210d3a1340030342a69a6bb7df3ccb643a)) (@fiam)

### Performance Improvements

* improve config generation/loading performance ([#1070](https://github.com/wundergraph/wundergraph/issues/1070)) ([5ba5a7a](https://github.com/wundergraph/wundergraph/commit/5ba5a7a5c9302fdb73e9a6d15a82fcaf28db62fa)), closes [#1020](https://github.com/wundergraph/wundergraph/issues/1020) (@fiam)

## [0.165.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.164.1...@wundergraph/sdk@0.165.0) (2023-06-09)

### Features

* add logging interface ([#1043](https://github.com/wundergraph/wundergraph/issues/1043)) ([5ffb1f2](https://github.com/wundergraph/wundergraph/commit/5ffb1f29e815b4337e73e5b5becb345047f79760)) (@fiam)
* add support for user-defined session durations ([#1035](https://github.com/wundergraph/wundergraph/issues/1035)) ([4ec4bcd](https://github.com/wundergraph/wundergraph/commit/4ec4bcdb5f5b8536bafc393b67dabc603055150e)) (@fiam)
* pass internal requests from ORM into GraphQLHandler ([#1049](https://github.com/wundergraph/wundergraph/issues/1049)) ([c58bd13](https://github.com/wundergraph/wundergraph/commit/c58bd13d7e314dcd09ff65b1cc32c7a2c7fabd03)) (@fiam)
* support oneof on inputs for the generated client ([#1031](https://github.com/wundergraph/wundergraph/issues/1031)) ([4635d05](https://github.com/wundergraph/wundergraph/commit/4635d05fa52a1c67fe3f1762499193b23faef037)) (@devsergiy)

### Bug Fixes

* handle nested type definitions in operation inputs when generating OAS ([#1056](https://github.com/wundergraph/wundergraph/issues/1056)) ([f2f8663](https://github.com/wundergraph/wundergraph/commit/f2f866327f5ffc48c7da030be991cf1188aa3d37)) (@fiam)

## [0.164.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.164.0...@wundergraph/sdk@0.164.1) (2023-06-06)

**Note:** Version bump only for package @wundergraph/sdk

## [0.164.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.163.3...@wundergraph/sdk@0.164.0) (2023-06-05)

### Features

* add withHeaders method to ORM ([#1025](https://github.com/wundergraph/wundergraph/issues/1025)) ([76641e1](https://github.com/wundergraph/wundergraph/commit/76641e14eccd417837745743b94155a157983322)) (@Pagebakers)

## [0.163.3](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.163.2...@wundergraph/sdk@0.163.3) (2023-06-04)

### Bug Fixes

* align otel attributes ([#1042](https://github.com/wundergraph/wundergraph/issues/1042)) ([106fbfd](https://github.com/wundergraph/wundergraph/commit/106fbfd671e16d2f4137c685e67e0a083f521b15)) (@StarpTech)

## [0.163.2](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.163.1...@wundergraph/sdk@0.163.2) (2023-06-02)

### Bug Fixes

* pass correct url to http.url otel attribute ([#1039](https://github.com/wundergraph/wundergraph/issues/1039)) ([a5adc66](https://github.com/wundergraph/wundergraph/commit/a5adc6640a657ab9a9e1027723f718583c42df93)) (@StarpTech)

## [0.163.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.163.0...@wundergraph/sdk@0.163.1) (2023-06-02)

**Note:** Version bump only for package @wundergraph/sdk

## [0.163.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.162.0...@wundergraph/sdk@0.163.0) (2023-06-01)

### Features

* otel instrumentation of wundernode and server ([#1004](https://github.com/wundergraph/wundergraph/issues/1004)) ([7b45975](https://github.com/wundergraph/wundergraph/commit/7b45975ca8fb41ff03cbcc84c42ec3536ad6db13)) (@StarpTech)

## [0.162.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.161.0...@wundergraph/sdk@0.162.0) (2023-05-31)

### Features

* fix replaceCustomScalars and add interface support ([#1000](https://github.com/wundergraph/wundergraph/issues/1000)) ([fa00db4](https://github.com/wundergraph/wundergraph/commit/fa00db471f7b9ef0d7372fbe7a5dec100bf62a50)) (@Aenimus)
* make timeout during authentication configurable ([#1018](https://github.com/wundergraph/wundergraph/issues/1018)) ([b5f6b74](https://github.com/wundergraph/wundergraph/commit/b5f6b744cd4efef456b9004b4109f7624e467f41)) (@fiam)

## [0.161.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.160.0...@wundergraph/sdk@0.161.0) (2023-05-31)

### Features

* add graphql enums to generated typescript model ([#1015](https://github.com/wundergraph/wundergraph/issues/1015)) ([845f036](https://github.com/wundergraph/wundergraph/commit/845f03608d13bc86e19c21769cb67a157232c3bf)) (@thisisnithin)
* use one web compatible fetch implementation on the server ([#1016](https://github.com/wundergraph/wundergraph/issues/1016)) ([784eddb](https://github.com/wundergraph/wundergraph/commit/784eddb209098a5bbd78c814aa9ccfed85c726b3)) (@StarpTech)

### Bug Fixes

* hook server strictness ([#1013](https://github.com/wundergraph/wundergraph/issues/1013)) ([f2608e5](https://github.com/wundergraph/wundergraph/commit/f2608e5ed9ac7f30c417e0a036e346d33d1c991f)) (@Pagebakers)
* infinite recursion when extracting enums ([#1022](https://github.com/wundergraph/wundergraph/issues/1022)) ([6e58da6](https://github.com/wundergraph/wundergraph/commit/6e58da63c1ba5d0e835c4dbd0d4ccebcc2220273)) (@thisisnithin)
* use Node.js fetch that supports web stream api ([#1007](https://github.com/wundergraph/wundergraph/issues/1007)) ([7977c79](https://github.com/wundergraph/wundergraph/commit/7977c79dc5dc9484c2412622828ac3a1380422fd)) (@StarpTech)

## [0.160.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.159.0...@wundergraph/sdk@0.160.0) (2023-05-26)

### Features

* use Prometheus to track and expose operation and API request counts ([#991](https://github.com/wundergraph/wundergraph/issues/991)) ([f949398](https://github.com/wundergraph/wundergraph/commit/f94939864c9ce7c3a9623fd5141fa486c4c9a55c)) (@fiam)

## [0.159.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.158.1...@wundergraph/sdk@0.159.0) (2023-05-25)

### Features

* add orm client to typescript webhooks ([#978](https://github.com/wundergraph/wundergraph/issues/978)) ([a45e3d0](https://github.com/wundergraph/wundergraph/commit/a45e3d0d3cf6eda738e4349c86dd6e5f1915f38e)) (@leoalves)
* add requireAuthentication directive ([#994](https://github.com/wundergraph/wundergraph/issues/994)) ([cef2382](https://github.com/wundergraph/wundergraph/commit/cef238285425df4c4bf97de95566ba0e2367da40)) (@Aenimus)
* improve Cache-Control support ([#959](https://github.com/wundergraph/wundergraph/issues/959)) ([1b330d5](https://github.com/wundergraph/wundergraph/commit/1b330d5c0207264ae0f3868276011ff9a8d83a67)) (@fiam)
* propagate authentication, client request and key headers between operations ([#982](https://github.com/wundergraph/wundergraph/issues/982)) ([53b513f](https://github.com/wundergraph/wundergraph/commit/53b513f8508aa5d7996ee0fb4150bd4c0fc10269)) (@fiam)
* re-enable plan cache for graphql handler ([#947](https://github.com/wundergraph/wundergraph/issues/947)) ([fe33fcd](https://github.com/wundergraph/wundergraph/commit/fe33fcd406ab914fa7e0a7b9c8fbf353bd8807c1)) (@jensneuse)

### Bug Fixes

* handle anyOf and types with unrepresentable names in OAS ([#975](https://github.com/wundergraph/wundergraph/issues/975)) ([1142eec](https://github.com/wundergraph/wundergraph/commit/1142eec17e3c8b5dd9724589620619a947315258)) (@fiam)
* pass customFetch down to base client ([#992](https://github.com/wundergraph/wundergraph/issues/992)) ([f91e334](https://github.com/wundergraph/wundergraph/commit/f91e33421307974d63fb83b3a408ab4f191c2b27)) (@Pagebakers)

## [0.158.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.158.0...@wundergraph/sdk@0.158.1) (2023-05-16)

**Note:** Version bump only for package @wundergraph/sdk

## [0.158.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.157.0...@wundergraph/sdk@0.158.0) (2023-05-15)

### Features

* orm ([#963](https://github.com/wundergraph/wundergraph/issues/963)) ([8cd45a3](https://github.com/wundergraph/wundergraph/commit/8cd45a37f139e592f579c40e266ce128b8be1b5d)) (@Pagebakers)

### Bug Fixes

* operations mutation handler ([#964](https://github.com/wundergraph/wundergraph/issues/964)) ([ec502be](https://github.com/wundergraph/wundergraph/commit/ec502bee7db2e763d0568208c6cae2c06640f5c7)) (@Pagebakers)

## [0.157.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.156.0...@wundergraph/sdk@0.157.0) (2023-05-12)

### Features

* context factories ([#914](https://github.com/wundergraph/wundergraph/issues/914)) ([ec60996](https://github.com/wundergraph/wundergraph/commit/ec60996ce766248a352655995af34c6b0338ceaf)) (@fiam)

## [0.156.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.155.0...@wundergraph/sdk@0.156.0) (2023-05-12)

### Features

* add support for caching in function handlers ([#932](https://github.com/wundergraph/wundergraph/issues/932)) ([ce31c4c](https://github.com/wundergraph/wundergraph/commit/ce31c4c02cbfd121886cf4c8a0fe354ac19ed340)) (@fiam)
* load .env.test instead .env for testing ([#950](https://github.com/wundergraph/wundergraph/issues/950)) ([a70d039](https://github.com/wundergraph/wundergraph/commit/a70d039217676caab230c2c88faea13b8c5055d1)) (@StarpTech)

### Bug Fixes

* clientrequest not passed to subscriptions in operation client ([#944](https://github.com/wundergraph/wundergraph/issues/944)) ([0c49451](https://github.com/wundergraph/wundergraph/commit/0c494511c22cf94cc806fbfe55abf712c914664c)) (@Pagebakers)

## [0.155.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.154.0...@wundergraph/sdk@0.155.0) (2023-05-09)

### Features

* official react-native and expo integration package ([#851](https://github.com/wundergraph/wundergraph/issues/851)) ([83e5231](https://github.com/wundergraph/wundergraph/commit/83e5231644ee540bd27097dec28b62589a5ebb7f)) (@Pagebakers)
* support all HTTP methods in mocking library ([#945](https://github.com/wundergraph/wundergraph/issues/945)) ([21173e0](https://github.com/wundergraph/wundergraph/commit/21173e051045579209707703766790cdfc90ecfa)) (@StarpTech)

## [0.154.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.153.0...@wundergraph/sdk@0.154.0) (2023-05-09)

### Features

* soap datasource ([#924](https://github.com/wundergraph/wundergraph/issues/924)) ([f545293](https://github.com/wundergraph/wundergraph/commit/f5452931aa27c5d0a9530e53a9ae3c692bf03b57)) (@devsergiy)
* update code generation to generate all typescript templates ([#927](https://github.com/wundergraph/wundergraph/issues/927)) ([20d11df](https://github.com/wundergraph/wundergraph/commit/20d11dfc800a64b8c4893235beb7c0d22774154b)) (@JivusAyrus)

### Bug Fixes

* polling for federation sources, allow individual configuration ([#921](https://github.com/wundergraph/wundergraph/issues/921)) ([424b470](https://github.com/wundergraph/wundergraph/commit/424b4703fca250919b571bcd70bf104c8fb41373)) (@fiam)

## [0.153.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.152.1...@wundergraph/sdk@0.153.0) (2023-05-08)

### Features

* improve mocking library, support N times and persistent mocks ([#934](https://github.com/wundergraph/wundergraph/issues/934)) ([029bf3a](https://github.com/wundergraph/wundergraph/commit/029bf3aa266bac21ecbdaf906115379fa7f6e37e)) (@StarpTech)

### Bug Fixes

* don't skip second level operations in Postman collections, skip internal ([#930](https://github.com/wundergraph/wundergraph/issues/930)) ([71302da](https://github.com/wundergraph/wundergraph/commit/71302da555ff7ab91f0bed9f0bada20db7244c3b)) (@fiam)

## [0.152.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.152.0...@wundergraph/sdk@0.152.1) (2023-05-05)

### Bug Fixes

* add enum fields from OAS to WG Graph ([#929](https://github.com/wundergraph/wundergraph/issues/929)) ([77c1b2a](https://github.com/wundergraph/wundergraph/commit/77c1b2ab6666724aefb22cebcea38845ed0e03b8)) (@uroslates)
* avoid generated typenames conflicts between <opName> and <opName>Internal ([#925](https://github.com/wundergraph/wundergraph/issues/925)) ([804f804](https://github.com/wundergraph/wundergraph/commit/804f804a6862003e7044c2841a57845f6ed732a8)) (@fiam)

## [0.152.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.151.0...@wundergraph/sdk@0.152.0) (2023-05-04)

### Features

* mocking error handling improvements ([#926](https://github.com/wundergraph/wundergraph/issues/926)) ([10c3018](https://github.com/wundergraph/wundergraph/commit/10c30181f8be203f4bb69c229c034f1e22dbdeba)) (@StarpTech)

## [0.151.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.150.0...@wundergraph/sdk@0.151.0) (2023-05-03)

### Features

* add support for reading OpenAPI error responses ([#916](https://github.com/wundergraph/wundergraph/issues/916)) ([6e9961d](https://github.com/wundergraph/wundergraph/commit/6e9961d011a65ba83ed16da058c97a03cc9b7436)), closes [#822](https://github.com/wundergraph/wundergraph/issues/822) (@fiam)

### Bug Fixes

* improve hook server types ([#919](https://github.com/wundergraph/wundergraph/issues/919)) ([4ecd7ee](https://github.com/wundergraph/wundergraph/commit/4ecd7ee21406166a8146de111da88f6b52cdc7c4)) (@Pagebakers)

## [0.150.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.149.1...@wundergraph/sdk@0.150.0) (2023-05-03)

### Features

* add support for custom claims of any type ([#911](https://github.com/wundergraph/wundergraph/issues/911)) ([c6f14f8](https://github.com/wundergraph/wundergraph/commit/c6f14f8d91db8bc908a85b20c6ef8f8561698078)) (@fiam)
* allow with hyphens and leading underscores in operation names ([#901](https://github.com/wundergraph/wundergraph/issues/901)) ([6abfbf6](https://github.com/wundergraph/wundergraph/commit/6abfbf6b5766b8840a39f6f96593ee6e8efc05dd)) (@fiam)

### Bug Fixes

* graphql schema extensions ([#920](https://github.com/wundergraph/wundergraph/issues/920)) ([bd4defc](https://github.com/wundergraph/wundergraph/commit/bd4defcd287119f9f63afaca9b3b55580ee36c6e)) (@jensneuse)

## [0.149.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.149.0...@wundergraph/sdk@0.149.1) (2023-04-27)

### Bug Fixes

* fixes issue where returning data from another ts operation would result in a type error ([#906](https://github.com/wundergraph/wundergraph/issues/906)) ([ca66195](https://github.com/wundergraph/wundergraph/commit/ca66195ac369f4b1d501c2a146be4a707e86292b)) (@Pagebakers)

## [0.149.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.148.2...@wundergraph/sdk@0.149.0) (2023-04-27)

### Features

* implement mocking capabilities ([#893](https://github.com/wundergraph/wundergraph/issues/893)) ([609c213](https://github.com/wundergraph/wundergraph/commit/609c213de78de918b95a6ab796d18843dc7a74c9)) (@StarpTech)

## [0.148.2](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.148.1...@wundergraph/sdk@0.148.2) (2023-04-27)

**Note:** Version bump only for package @wundergraph/sdk

## [0.148.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.148.0...@wundergraph/sdk@0.148.1) (2023-04-26)

**Note:** Version bump only for package @wundergraph/sdk

## [0.148.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.147.1...@wundergraph/sdk@0.148.0) (2023-04-26)

### Features

* inconsistencies in ts clients api ([#857](https://github.com/wundergraph/wundergraph/issues/857)) ([9f31b17](https://github.com/wundergraph/wundergraph/commit/9f31b1744e97d9e5358c5e5eed011eebfa6938cc)) (@Pagebakers)

### Bug Fixes

* incorrect env read for public node url ([#897](https://github.com/wundergraph/wundergraph/issues/897)) ([100a88f](https://github.com/wundergraph/wundergraph/commit/100a88ff37d0a5e98db67bdda7adad26a3e5872e)) (@thisisnithin)

## [0.147.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.147.0...@wundergraph/sdk@0.147.1) (2023-04-25)

**Note:** Version bump only for package @wundergraph/sdk

## [0.147.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.146.1...@wundergraph/sdk@0.147.0) (2023-04-24)

### Features

* add support for using proxies in data sources ([#854](https://github.com/wundergraph/wundergraph/issues/854)) ([a472c46](https://github.com/wundergraph/wundergraph/commit/a472c463d6dbcb20b48444fdd4ce9c797c16feb2)) (@fiam)
* initial implementation for the operations code generation ([#877](https://github.com/wundergraph/wundergraph/issues/877)) ([aab4c60](https://github.com/wundergraph/wundergraph/commit/aab4c604a39bebc0dc3219964ae887be64f25f02)) (@jensneuse)

### Bug Fixes

* ensure input is undefined when not defined as schema ([#864](https://github.com/wundergraph/wundergraph/issues/864)) ([ba68d06](https://github.com/wundergraph/wundergraph/commit/ba68d0681b04d62c3a12b68a423f783d2380a594)) (@StarpTech)
* internal router ([#872](https://github.com/wundergraph/wundergraph/issues/872)) ([37fa469](https://github.com/wundergraph/wundergraph/commit/37fa469493196a2fdcdc975a9ce29a9be0147a0d)) (@thisisnithin)

## [0.146.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.146.0...@wundergraph/sdk@0.146.1) (2023-04-20)

**Note:** Version bump only for package @wundergraph/sdk

## [0.146.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.145.2...@wundergraph/sdk@0.146.0) (2023-04-19)

### Features

* implement internal graphql handler ([#853](https://github.com/wundergraph/wundergraph/issues/853)) ([ad42f5f](https://github.com/wundergraph/wundergraph/commit/ad42f5f9f23a0e6ec968a1c5fefb226f2b46254a)) (@thisisnithin)

## [0.145.2](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.145.1...@wundergraph/sdk@0.145.2) (2023-04-19)

**Note:** Version bump only for package @wundergraph/sdk

## [0.145.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.145.0...@wundergraph/sdk@0.145.1) (2023-04-19)

**Note:** Version bump only for package @wundergraph/sdk

## [0.145.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.144.5...@wundergraph/sdk@0.145.0) (2023-04-17)

### Features

* sdk testsuite ([#844](https://github.com/wundergraph/wundergraph/issues/844)) ([e3e53a9](https://github.com/wundergraph/wundergraph/commit/e3e53a9c571cb97b65848f1998cce58e1d7b514f)) (@StarpTech)

## [0.144.5](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.144.4...@wundergraph/sdk@0.144.5) (2023-04-15)

**Note:** Version bump only for package @wundergraph/sdk

## [0.144.4](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.144.3...@wundergraph/sdk@0.144.4) (2023-04-14)

### Bug Fixes

* overhaul listener option handling ([#840](https://github.com/wundergraph/wundergraph/issues/840)) ([17563a5](https://github.com/wundergraph/wundergraph/commit/17563a541986b4640c3f2b676a4dbb1f7efe1152)) (@StarpTech)

## [0.144.3](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.144.2...@wundergraph/sdk@0.144.3) (2023-04-14)

**Note:** Version bump only for package @wundergraph/sdk

## [0.144.2](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.144.1...@wundergraph/sdk@0.144.2) (2023-04-13)

### Bug Fixes

* export CreateWebhookProps ([#833](https://github.com/wundergraph/wundergraph/issues/833)) ([bc77c15](https://github.com/wundergraph/wundergraph/commit/bc77c159daab619e777be1f4ebaccff2e30027c6)) (@Pagebakers)
* issue where webhooks with payload would fail ([#835](https://github.com/wundergraph/wundergraph/issues/835)) ([64c9147](https://github.com/wundergraph/wundergraph/commit/64c91477248a85bfa375b39494c9e4f0e6a1807c)) (@Pagebakers)

## [0.144.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.144.0...@wundergraph/sdk@0.144.1) (2023-04-12)

**Note:** Version bump only for package @wundergraph/sdk

## [0.144.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.143.1...@wundergraph/sdk@0.144.0) (2023-04-12)

### Features

* mark operations as internal when inside internal folder ([#803](https://github.com/wundergraph/wundergraph/issues/803)) ([c2ed5b0](https://github.com/wundergraph/wundergraph/commit/c2ed5b0dd2dde342860ba3bd0c2dcdbaa335cbcd)) (@thisisnithin)
* sveltekit & vite-svelte examples ([#805](https://github.com/wundergraph/wundergraph/issues/805)) ([094ae35](https://github.com/wundergraph/wundergraph/commit/094ae35d0b1fc3acd2aca2b952309367876c73d4)) (@DaniAkash)
* tui + log handling ([#813](https://github.com/wundergraph/wundergraph/issues/813)) ([6bf7498](https://github.com/wundergraph/wundergraph/commit/6bf74980c69def43e4af8bdfdcc0fb5645a1025b)) (@StarpTech)

## [0.143.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.143.0...@wundergraph/sdk@0.143.1) (2023-04-04)

### Bug Fixes

* translating oas spec in the v2 oas introspection ([#787](https://github.com/wundergraph/wundergraph/issues/787)) ([30496a4](https://github.com/wundergraph/wundergraph/commit/30496a44b7bf03aae77a8e5bfb037ce8d3165d37)) (@devsergiy)

## [0.143.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.142.2...@wundergraph/sdk@0.143.0) (2023-03-31)

### Features

* add beta omnigraph backed open api data ([#771](https://github.com/wundergraph/wundergraph/issues/771)) ([a2c94f6](https://github.com/wundergraph/wundergraph/commit/a2c94f6b081f8ed3d3f2df2e9bf605fa1278713d)) (@devsergiy)

## [0.142.2](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.142.1...@wundergraph/sdk@0.142.2) (2023-03-30)

### Bug Fixes

* make TS operation response schema generation more forgiving ([#776](https://github.com/wundergraph/wundergraph/issues/776)) ([f6cde4f](https://github.com/wundergraph/wundergraph/commit/f6cde4fa3c3e3027feab87deb078eca749e975ea)), closes [#762](https://github.com/wundergraph/wundergraph/issues/762) (@fiam)

## [0.142.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.142.0...@wundergraph/sdk@0.142.1) (2023-03-29)

### Bug Fixes

* print compiler error messages during TS operation response schema generation ([#761](https://github.com/wundergraph/wundergraph/issues/761)) ([0ff8feb](https://github.com/wundergraph/wundergraph/commit/0ff8feb80b9ca83452bb8888fc651f4a5a535c4e)) (@fiam)
* support TS operations that never return ([#762](https://github.com/wundergraph/wundergraph/issues/762)) ([7092f90](https://github.com/wundergraph/wundergraph/commit/7092f907f1448fe6a7455e868726bb6e511478f9)) (@fiam)

## [0.142.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.141.0...@wundergraph/sdk@0.142.0) (2023-03-28)

### Features

* custom error support for typescript operations ([#759](https://github.com/wundergraph/wundergraph/issues/759)) ([7cfa815](https://github.com/wundergraph/wundergraph/commit/7cfa815a44b0b2a1184c2c50d0c4ea7cbb8066a7)) (@StarpTech)
* use .cjs extension for commonjs to support esm projects ([#752](https://github.com/wundergraph/wundergraph/issues/752)) ([7045b52](https://github.com/wundergraph/wundergraph/commit/7045b529d0f6ac339c6959668c77325777326a6f)) (@Pagebakers)

## [0.141.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.140.0...@wundergraph/sdk@0.141.0) (2023-03-27)

### Features

* add build_info.json to sdk ([#758](https://github.com/wundergraph/wundergraph/issues/758)) ([e34c94f](https://github.com/wundergraph/wundergraph/commit/e34c94fefc6b624ada2d4ad36ce8589309620950)) (@Aenimus)

## [0.140.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.139.0...@wundergraph/sdk@0.140.0) (2023-03-23)

### Features

* add raw sql support ([#745](https://github.com/wundergraph/wundergraph/issues/745)) ([081ef23](https://github.com/wundergraph/wundergraph/commit/081ef23ca4e63a12344b24cfed858a1fb1a0d5b8)) (@jensneuse)
* new local cache implementation ([#727](https://github.com/wundergraph/wundergraph/issues/727)) ([111decc](https://github.com/wundergraph/wundergraph/commit/111decc1cdba258ce9936cfbe396511536b48ee2)) (@fiam)

### Bug Fixes

* data corruption when polling is enabled for federation sources ([#753](https://github.com/wundergraph/wundergraph/issues/753)) ([daa8a8c](https://github.com/wundergraph/wundergraph/commit/daa8a8c386ab9ad9bfd707f351815d0976d26ae4)) (@fiam)

## [0.139.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.138.0...@wundergraph/sdk@0.139.0) (2023-03-16)

### Features

* annotate OpenAPI spec with operation types and auth requirements ([#728](https://github.com/wundergraph/wundergraph/issues/728)) ([67836a8](https://github.com/wundergraph/wundergraph/commit/67836a84f51ca0875c20e8d9e9a5144e091e4499)) (@fiam)

### Bug Fixes

* custom int/float scalars usage in arguments ([#427](https://github.com/wundergraph/wundergraph/issues/427))Co-authored-by: Alberto García Hierro <alberto@garciahierro.com> Co-authored-by: Sergiy <818351+devsergiy@users.noreply.github.com> Co-authored-by: spetrunin <neyasut@gmail.com> ([2b424f3](https://github.com/wundergraph/wundergraph/commit/2b424f3daaabea25abb4a23139751ff0ab2adefe)) (@OLingard)
* do not inject empty queries ([#718](https://github.com/wundergraph/wundergraph/issues/718))Co-authored-by: Sergiy <818351+devsergiy@users.noreply.github.com> Co-authored-by: Eelco Wiersma <contact@pagebakers.nl> Co-authored-by: Alberto García Hierro <alberto@garciahierro.com> ([47c1cf3](https://github.com/wundergraph/wundergraph/commit/47c1cf39b7a36e86e0dc5adc77ac1113fea4f178)) (@erguotou520)
* fixing multidimensional array schema in codegen ([#731](https://github.com/wundergraph/wundergraph/issues/731))Co-authored-by: abdelhameedalsayed <abdulhameed.azab@gmail.com> ([73e2a09](https://github.com/wundergraph/wundergraph/commit/73e2a097826d593bbb0dbda9c2a7856110aa3b36)) (@abdelhameedhamdy)

## [0.138.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.137.4...@wundergraph/sdk@0.138.0) (2023-03-06)

### Features

* add support for declaring a list of public claims ([#706](https://github.com/wundergraph/wundergraph/issues/706)) ([2223d5c](https://github.com/wundergraph/wundergraph/commit/2223d5c02f1eadaad7ecb6ac863bb2f9e34c926c)) (@fiam)
* add support for generating OpenAPI specs for applications ([#716](https://github.com/wundergraph/wundergraph/issues/716)) ([fca90e3](https://github.com/wundergraph/wundergraph/commit/fca90e3c662001cb88822088533a500da6979c82)) (@fiam)
* add support for injecting variables into nested paths ([#678](https://github.com/wundergraph/wundergraph/issues/678)) ([ce0a0a0](https://github.com/wundergraph/wundergraph/commit/ce0a0a09b4e739767b17f1ad391074f6ba597253)) (@fiam)
* improve webhooks API and add support for the new operations client ([#709](https://github.com/wundergraph/wundergraph/issues/709)) ([35e69a3](https://github.com/wundergraph/wundergraph/commit/35e69a3c174ba94189a95428f06946a0f992db31)) (@Pagebakers)

### Bug Fixes

* upload types ([#723](https://github.com/wundergraph/wundergraph/issues/723)) ([5077a7d](https://github.com/wundergraph/wundergraph/commit/5077a7d2ab363d3bbbb1df35423e5ad799b1800f)) (@Pagebakers)

## [0.137.4](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.137.3...@wundergraph/sdk@0.137.4) (2023-03-01)

**Note:** Version bump only for package @wundergraph/sdk

## [0.137.3](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.137.2...@wundergraph/sdk@0.137.3) (2023-03-01)

**Note:** Version bump only for package @wundergraph/sdk

## [0.137.2](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.137.1...@wundergraph/sdk@0.137.2) (2023-02-28)

### Bug Fixes

* graphql introspection with renamed query types ([#699](https://github.com/wundergraph/wundergraph/issues/699)) ([864305f](https://github.com/wundergraph/wundergraph/commit/864305fe65368c390ce499ee42817d6456f5a281)) (@devsergiy)

## [0.137.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.137.0...@wundergraph/sdk@0.137.1) (2023-02-26)

### Bug Fixes

* enable ts strict mode in examples for much faster type inference ([#696](https://github.com/wundergraph/wundergraph/issues/696)) ([85e6d88](https://github.com/wundergraph/wundergraph/commit/85e6d884e6a73ad752f65d06c6da91f56c85445d)) (@StarpTech)

## [0.137.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.136.0...@wundergraph/sdk@0.137.0) (2023-02-23)

### Features

* add json patch support, response zod schema for ts operations ([#689](https://github.com/wundergraph/wundergraph/issues/689)) ([02f40dc](https://github.com/wundergraph/wundergraph/commit/02f40dc21e63c1771ee7b002c94a396a52f85187)) (@jensneuse)

## [0.136.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.135.0...@wundergraph/sdk@0.136.0) (2023-02-21)

### Features

* add support for hooks in internal API calls ([#669](https://github.com/wundergraph/wundergraph/issues/669)) ([3734d1d](https://github.com/wundergraph/wundergraph/commit/3734d1d42a978c378dd5d6c9b44ad0e93c5ede30)) (@fiam)
* new open api introspection ([#621](https://github.com/wundergraph/wundergraph/issues/621)) ([0f070bb](https://github.com/wundergraph/wundergraph/commit/0f070bb28b37c4cfe30b356f2c11c1f69d1bd903)) (@spetrunin)
* **postman:** add folders for postman collections + postman types ([#624](https://github.com/wundergraph/wundergraph/issues/624))Co-authored-by: Alberto García Hierro <alberto@garciahierro.com> Co-authored-by: Dustin Deus <deusdustin@gmail.com> ([1f89f63](https://github.com/wundergraph/wundergraph/commit/1f89f630147105f72084020332546a093a0908f2)) (@andreimc)

### Bug Fixes

* client template imports ([#679](https://github.com/wundergraph/wundergraph/issues/679)) ([4ab4146](https://github.com/wundergraph/wundergraph/commit/4ab4146c7351feaa8817f7dad63efbdb59a1cb0e)) (@rwest202)
* modify build scripts ([#660](https://github.com/wundergraph/wundergraph/issues/660)) ([8bbfa96](https://github.com/wundergraph/wundergraph/commit/8bbfa96aaa92243772bda44b62c23e191d5be54f)) (@JivusAyrus)

## [0.135.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.134.0...@wundergraph/sdk@0.135.0) (2023-02-10)

### Features

* add support for custom claims ([#648](https://github.com/wundergraph/wundergraph/issues/648) ([682b88c](https://github.com/wundergraph/wundergraph/commit/682b88c115512878aa22b57d4ed67c07fd88726b)) (@fiam)

### Bug Fixes

* internal client should use correct mappings for nested operations ([#661](https://github.com/wundergraph/wundergraph/issues/661)) ([37e0509](https://github.com/wundergraph/wundergraph/commit/37e050914813ea58dbdfeaa2d48e0d4ffa2f9157)) (@jensneuse)

## [0.134.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.133.1...@wundergraph/sdk@0.134.0) (2023-02-03)

### Features

* add support for uploads from anonymous users ([#632](https://github.com/wundergraph/wundergraph/issues/632)) ([485975b](https://github.com/wundergraph/wundergraph/commit/485975be55a8c1c82a4610431c7514d3c3c2dfe0)) (@fiam)

### Bug Fixes

* avoid feeding paths into applicationHash calculation ([#636](https://github.com/wundergraph/wundergraph/issues/636)) ([8542cf6](https://github.com/wundergraph/wundergraph/commit/8542cf6789de51711b05b0fbc4bb78d895e0e099)) (@fiam)
* pass file upload hooks to upload configuration resolution ([#631](https://github.com/wundergraph/wundergraph/issues/631)) ([95a7bd7](https://github.com/wundergraph/wundergraph/commit/95a7bd784818141d769a105fd86a635daf9cb3f8)) (@fiam)

## [0.133.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.133.0...@wundergraph/sdk@0.133.1) (2023-02-01)

### Bug Fixes

* factory type errors ([#625](https://github.com/wundergraph/wundergraph/issues/625)) ([8e6e81b](https://github.com/wundergraph/wundergraph/commit/8e6e81b8e8dfb6c0640789dd04a8b598232733cc)) (@Pagebakers)

## [0.133.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.132.1...@wundergraph/sdk@0.133.0) (2023-01-30)

### Features

* add prisma datasource ([#605](https://github.com/wundergraph/wundergraph/issues/605)) ([2f0cfa5](https://github.com/wundergraph/wundergraph/commit/2f0cfa5e420080772a6552f4a256c7d71906f84a)) (@jensneuse)
* federation, support extend keyword ([#578](https://github.com/wundergraph/wundergraph/issues/578)) ([903e880](https://github.com/wundergraph/wundergraph/commit/903e88024f65c03d2354cf199c865e44edd22a6b)) (@YuriBuerov)

### Bug Fixes

* enforce token validation if any token keys are defined ([#580](https://github.com/wundergraph/wundergraph/issues/580)) ([4bb88fc](https://github.com/wundergraph/wundergraph/commit/4bb88fc155a058dfd0003b7d86caa0afcfa6b86c)) (@fiam)
* paths and uri composition on Windows when using nested directories for operations ([#607](https://github.com/wundergraph/wundergraph/issues/607)) ([ee2467f](https://github.com/wundergraph/wundergraph/commit/ee2467f340927798fa25369dbe141509e8b7d739)) (@fiam)

## [0.132.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.132.0...@wundergraph/sdk@0.132.1) (2023-01-23)

### Bug Fixes

* mark json-schema-to-typescript as dependency instead of devDependency ([#584](https://github.com/wundergraph/wundergraph/issues/584)) ([1c890d1](https://github.com/wundergraph/wundergraph/commit/1c890d11e9ea40fe322eef272818af578016c9f5)) (@fiam)
* use operationPath in client operation metadata ([#583](https://github.com/wundergraph/wundergraph/issues/583)) ([fb2c322](https://github.com/wundergraph/wundergraph/commit/fb2c3224a240a3b73e453cfe6874ef5a066f4d4a)) (@spetrunin)

## [0.132.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.131.2...@wundergraph/sdk@0.132.0) (2023-01-20)

### Features

* add upload profiles for S3 providers ([#476](https://github.com/wundergraph/wundergraph/issues/476)) ([6144545](https://github.com/wundergraph/wundergraph/commit/614454539133c7f235aea6aa72ade36059f41c97)) (@fiam)
* migrate to .graphqlrc ([#537](https://github.com/wundergraph/wundergraph/issues/537)) ([f99a046](https://github.com/wundergraph/wundergraph/commit/f99a046c6cccb00e9c57224304be0c3dccc9c909)) (@fiam)

## [0.131.2](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.131.1...@wundergraph/sdk@0.131.2) (2023-01-20)

### Bug Fixes

* operations loading and normalization ([#568](https://github.com/wundergraph/wundergraph/issues/568)) ([f34fc98](https://github.com/wundergraph/wundergraph/commit/f34fc98227e9a988499fd388e3883a07128dcdd7)) (@spetrunin)

## [0.131.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.131.0...@wundergraph/sdk@0.131.1) (2023-01-19)

### Bug Fixes

* handle consecutive hyphens or underscores when formatting field … ([#566](https://github.com/wundergraph/wundergraph/issues/566)) ([810b31c](https://github.com/wundergraph/wundergraph/commit/810b31cfbc135a93b65ffaeed20f64d003646548)) (@Aenimus)
* operation metadata type imports ([#501](https://github.com/wundergraph/wundergraph/issues/501)) ([1dcb746](https://github.com/wundergraph/wundergraph/commit/1dcb746110a9dc518d02fe82184bedf67e2a5d51)) (@rwest202)
* path formatting for resolveFieldName ([#565](https://github.com/wundergraph/wundergraph/issues/565)) ([7416b61](https://github.com/wundergraph/wundergraph/commit/7416b61e99037aef15ce6e2bb3812a36c2ca3bed)) (@Aenimus)

## [0.131.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.130.2...@wundergraph/sdk@0.131.0) (2023-01-17)

### Features

* add support for disconnecting from Auth0 ([#525](https://github.com/wundergraph/wundergraph/issues/525)) ([7465fb2](https://github.com/wundergraph/wundergraph/commit/7465fb21a3618924c7dfb59a6a2f94c7d740f0f8)) (@fiam)
* make input required if there are required variables ([#551](https://github.com/wundergraph/wundergraph/issues/551)) ([00256bf](https://github.com/wundergraph/wundergraph/commit/00256bf456f0c733beb45a5cdbc258f84631975e)) (@Pagebakers)
* upgrade to nextjs 13 ([#504](https://github.com/wundergraph/wundergraph/issues/504)) ([45bc431](https://github.com/wundergraph/wundergraph/commit/45bc431243cc61765c2712b03e89818a1bb3d14a)) (@Pagebakers)

### Bug Fixes

* allow to treat a subgraph as regular graphql api ([#496](https://github.com/wundergraph/wundergraph/issues/496)) ([cac56f1](https://github.com/wundergraph/wundergraph/commit/cac56f1ffc7d16701abd1e921820d558121e94f1)) (@spetrunin)
* json scalar types rendering not supported for graphql api ([#516](https://github.com/wundergraph/wundergraph/issues/516)) ([76ad844](https://github.com/wundergraph/wundergraph/commit/76ad84425ad0851c7217e87ac40b2ba89c90fc88)) (@spetrunin)
* prevent swallowing of input validation errors ([#529](https://github.com/wundergraph/wundergraph/issues/529)) ([39ea3fc](https://github.com/wundergraph/wundergraph/commit/39ea3fc3fbf96916f1165228194b8c915882b133)) (@Aenimus)

## [0.130.2](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.130.1...@wundergraph/sdk@0.130.2) (2022-12-31)

**Note:** Version bump only for package @wundergraph/sdk

## [0.130.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.130.0...@wundergraph/sdk@0.130.1) (2022-12-31)

**Note:** Version bump only for package @wundergraph/sdk

## [0.130.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.129.0...@wundergraph/sdk@0.130.0) (2022-12-29)

### ⚠ BREAKING CHANGES

* **node:** restructure server imports (#497)

### Features

* **node:** restructure server imports ([#497](https://github.com/wundergraph/wundergraph/issues/497)) ([ac277de](https://github.com/wundergraph/wundergraph/commit/ac277dec5c06bb761d6acb026248dedd3d1f59c0)) (@StarpTech)

### Bug Fixes

* use 0.0.0.0 for test server ([#499](https://github.com/wundergraph/wundergraph/issues/499)) ([126778b](https://github.com/wundergraph/wundergraph/commit/126778b88d3e546be1870e4bfb7c8e9d429f3fe1)) (@spetrunin)

## [0.129.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.128.0...@wundergraph/sdk@0.129.0) (2022-12-28)

### Features

* add [@remove](https://github.com/remove)NullVariables directives ([#477](https://github.com/wundergraph/wundergraph/issues/477)) ([0f4398b](https://github.com/wundergraph/wundergraph/commit/0f4398b1509b5939e0c4b5824ae2b64c0646e101)) (@spetrunin)

## [0.128.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.127.0...@wundergraph/sdk@0.128.0) (2022-12-21)

### Features

* better error messages when resolving undefined variables ([#419](https://github.com/wundergraph/wundergraph/issues/419)) ([aa0dd65](https://github.com/wundergraph/wundergraph/commit/aa0dd65cb6fc837cf4de962e915bb1c541d18418)), closes [#262](https://github.com/wundergraph/wundergraph/issues/262) (@fiam)

## [0.127.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.126.0...@wundergraph/sdk@0.127.0) (2022-12-20)

### Features

* **ci:** add CI workflow for examples ([#428](https://github.com/wundergraph/wundergraph/issues/428)) ([72c1616](https://github.com/wundergraph/wundergraph/commit/72c16160205cd2e61ffcf493c9eb488214ff42cb)) (@fiam)

### Bug Fixes

* csrf and authenticated uploads ([#456](https://github.com/wundergraph/wundergraph/issues/456)) ([6138a98](https://github.com/wundergraph/wundergraph/commit/6138a98c20286e9693ab9df0245006c2d73043ab)) (@thisisnithin)
* detect server ready when the hooks server health check is disabled ([#462](https://github.com/wundergraph/wundergraph/issues/462)) ([e324f1c](https://github.com/wundergraph/wundergraph/commit/e324f1c681d83658ce0300e2e938ffbb73a3c779)) (@fiam)

## [0.126.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.125.0...@wundergraph/sdk@0.126.0) (2022-12-15)

### Features

* listen on both IPv4 and IPv6 by default ([#451](https://github.com/wundergraph/wundergraph/issues/451)) ([b1fd332](https://github.com/wundergraph/wundergraph/commit/b1fd332dcaf8c15209b8329f0c96cb1d4c4972ab)) (@fiam)

## [0.125.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.124.1...@wundergraph/sdk@0.125.0) (2022-12-14)

### Features

* add WunderGraph testing library ([#345](https://github.com/wundergraph/wundergraph/issues/345)) ([13d47b5](https://github.com/wundergraph/wundergraph/commit/13d47b50e7f54dba1c6f7188204c285d8de523c4)) (@fiam)
* implement telemetry ([#424](https://github.com/wundergraph/wundergraph/issues/424)) ([8cd3d29](https://github.com/wundergraph/wundergraph/commit/8cd3d299e39afcd0bce6c1e6c2459e268a09af7b)) (@StarpTech)

### Bug Fixes

* nextjs-swr example ([#434](https://github.com/wundergraph/wundergraph/issues/434)) ([0cae074](https://github.com/wundergraph/wundergraph/commit/0cae0746a0dc36a8a5f8514e4c078363afab3b94)) (@fiam)

## [0.124.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.124.0...@wundergraph/sdk@0.124.1) (2022-12-08)

**Note:** Version bump only for package @wundergraph/sdk

## [0.124.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.123.2...@wundergraph/sdk@0.124.0) (2022-12-06)

### Features

* make detecting invalid operations easier ([#374](https://github.com/wundergraph/wundergraph/issues/374)) ([45639db](https://github.com/wundergraph/wundergraph/commit/45639db0ae3adb8cac4f62b623b04061118f7bf7)) (@fiam)
* react query client ([#340](https://github.com/wundergraph/wundergraph/issues/340)) ([c5769a4](https://github.com/wundergraph/wundergraph/commit/c5769a422970e8eaf626dd767cf09252789bcd1f)) (@Pagebakers)

### Bug Fixes

* generate all required templates ([#360](https://github.com/wundergraph/wundergraph/issues/360)) ([ce2f130](https://github.com/wundergraph/wundergraph/commit/ce2f130829dfc4e4c7e468fcdc364bc7adef00d2)) (@JivusAyrus)
* remove colors from configurePublishWunderGraphAPI() ([#371](https://github.com/wundergraph/wundergraph/issues/371)) ([371ed96](https://github.com/wundergraph/wundergraph/commit/371ed96e759f2bf0daa774c5f26705504b79f11d)) (@fiam)
* replace graphql-weather-api.herokuapp.com with our own copy ([#390](https://github.com/wundergraph/wundergraph/issues/390)) ([1b99525](https://github.com/wundergraph/wundergraph/commit/1b995252af8bf7970cb1e0740b0b17412760de13)) (@fiam)
* stop wunderctl on normalization errors, exit with non-zero ([#370](https://github.com/wundergraph/wundergraph/issues/370)) ([a0b9b9e](https://github.com/wundergraph/wundergraph/commit/a0b9b9ef446aee6031b07e9bbbf2d7ed471fd066)) (@fiam)

## [0.123.2](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.123.0...@wundergraph/sdk@0.123.2) (2022-11-20)

**Note:** Version bump only for package @wundergraph/sdk

## [0.123.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.123.0...@wundergraph/sdk@0.123.1) (2022-11-20)

**Note:** Version bump only for package @wundergraph/sdk

## [0.123.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.122.0...@wundergraph/sdk@0.123.0) (2022-11-18)

### Features

* remove app/main from URL structure ([#335](https://github.com/wundergraph/wundergraph/issues/335)) ([e49e585](https://github.com/wundergraph/wundergraph/commit/e49e585528297126b93958105e80b68f1943d781)), closes [#333](https://github.com/wundergraph/wundergraph/issues/333) (@fiam)
* sdk, schema extension fields config ([#336](https://github.com/wundergraph/wundergraph/issues/336)) ([ca09b3c](https://github.com/wundergraph/wundergraph/commit/ca09b3cf2002763b7ea53a7d50f6dce50d08c120)) (@YuriBuerov)

## [0.122.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.121.0...@wundergraph/sdk@0.122.0) (2022-11-17)

### Features

* **breaking:** the Next.js client now uses SWR ([#319](https://github.com/wundergraph/wundergraph/issues/319)) ([020cd74](https://github.com/wundergraph/wundergraph/commit/020cd74091517faedcd97071d48a19395cbcd9bf)) (@Pagebakers)
* logging, request id ([#323](https://github.com/wundergraph/wundergraph/issues/323)) ([ed39136](https://github.com/wundergraph/wundergraph/commit/ed3913693b7233ee58ce8423d1ee0ab833c1d161)) (@YuriBuerov)

## [0.121.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.120.0...@wundergraph/sdk@0.121.0) (2022-11-11)

### Features

* allow static string with placeholder OR environment variable for OAS baseURL ([41b7ce6](https://github.com/wundergraph/wundergraph/commit/41b7ce6a02b5159fbdff522a881a61da37221cd0)) (@jensneuse)
* improved SWR hooks api, useMutation result no longer cached and updated to SWR 2.0 ([#305](https://github.com/wundergraph/wundergraph/issues/305)) ([fc4848b](https://github.com/wundergraph/wundergraph/commit/fc4848b3f15b447a487b31bd3d152f134c6f3aeb)) (@Pagebakers)

### Bug Fixes

* errors when wundergraph.server.ts does not exist ([#327](https://github.com/wundergraph/wundergraph/issues/327)) ([5df223d](https://github.com/wundergraph/wundergraph/commit/5df223d9f7428b36e7d7f95632007d966f624e10)) (@fiam)
* make baseURL optional ([#330](https://github.com/wundergraph/wundergraph/issues/330)) ([fcb7133](https://github.com/wundergraph/wundergraph/commit/fcb7133c62fe7ae8057584860857e858e6e2a8d9)) (@Pagebakers)
* **oas:** use primitive schema references as the field schema ([#326](https://github.com/wundergraph/wundergraph/issues/326)) ([3a6d636](https://github.com/wundergraph/wundergraph/commit/3a6d6367a81dd7aed91b84950897258c775790dd)) (@acdn-sglanzer)
* operation metadata in react provider ([#293](https://github.com/wundergraph/wundergraph/issues/293)) ([ad02a27](https://github.com/wundergraph/wundergraph/commit/ad02a27af5dddbcf8e1126e5bf32c949005630b2)) (@rwest202)
* set upload type when s3 is not configured ([#324](https://github.com/wundergraph/wundergraph/issues/324)) ([68b34d7](https://github.com/wundergraph/wundergraph/commit/68b34d7b5436dfe8d88c7e3a27e0975a263e5034)) (@Pagebakers)

## [0.120.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.119.0...@wundergraph/sdk@0.120.0) (2022-11-08)

### Features

* createClient now returns typesafe client ([#307](https://github.com/wundergraph/wundergraph/issues/307)) ([803ebd5](https://github.com/wundergraph/wundergraph/commit/803ebd5d799688586a8a8abdde8cf5d7b2ea9557)) (@Pagebakers)

## [0.119.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.118.0...@wundergraph/sdk@0.119.0) (2022-11-04)

### Features

* eng 640 compose subgraphs without apollo dependencies ([#315](https://github.com/wundergraph/wundergraph/issues/315)) ([628a183](https://github.com/wundergraph/wundergraph/commit/628a18303acb47df5a10118b17a4e88916b2903a)) (@jensneuse)
* sdk, support schema extension ([#302](https://github.com/wundergraph/wundergraph/issues/302)) ([e952af6](https://github.com/wundergraph/wundergraph/commit/e952af61428d0592876362bc19155d45fec626f1)) (@YuriBuerov)

## [0.118.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.117.4...@wundergraph/sdk@0.118.0) (2022-11-03)

### Features

* improve server graceful shutdown ([#314](https://github.com/wundergraph/wundergraph/issues/314)) ([14da07d](https://github.com/wundergraph/wundergraph/commit/14da07d6ca1b6c6cd1571e8322338c1684f92ff8)) (@StarpTech)

## [0.117.4](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.117.3...@wundergraph/sdk@0.117.4) (2022-11-03)

**Note:** Version bump only for package @wundergraph/sdk

## [0.117.3](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.117.2...@wundergraph/sdk@0.117.3) (2022-11-03)

**Note:** Version bump only for package @wundergraph/sdk

## [0.117.2](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.117.1...@wundergraph/sdk@0.117.2) (2022-11-03)

### Bug Fixes

* skip introspection cache when OpenAPI source is a file ([#309](https://github.com/wundergraph/wundergraph/issues/309)) ([911a551](https://github.com/wundergraph/wundergraph/commit/911a551ced23b5d455d0321f1dc2eeebe979d65d)) (@fiam)

## [0.117.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.117.0...@wundergraph/sdk@0.117.1) (2022-10-23)

**Note:** Version bump only for package @wundergraph/sdk

## [0.117.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.116.1...@wundergraph/sdk@0.117.0) (2022-10-20)

### Features

* healthcheck, node and hooks server ([#274](https://github.com/wundergraph/wundergraph/issues/274)) ([b7f7ecc](https://github.com/wundergraph/wundergraph/commit/b7f7eccef038cf03913740cb43360ca1d38dc016)) (@YuriBuerov)
* make WunderGraphConfigApplicationConfig.cors optional ([#270](https://github.com/wundergraph/wundergraph/issues/270)) ([4bb2658](https://github.com/wundergraph/wundergraph/commit/4bb26586b795b4b7682d4dc43574f9d765d6be86)) (@fiam)
* subscriptions, operation hooks ([#260](https://github.com/wundergraph/wundergraph/issues/260)) ([3199931](https://github.com/wundergraph/wundergraph/commit/31999317c0d95098cefaef7b19b51aa9c0248353)) (@YuriBuerov)

### Bug Fixes

* exit node process when parent exited ([#271](https://github.com/wundergraph/wundergraph/issues/271)) ([fbc8608](https://github.com/wundergraph/wundergraph/commit/fbc8608a96ed5aa40afe17fa2ad658bd650d6257)) (@spetrunin)

## [0.116.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.116.0...@wundergraph/sdk@0.116.1) (2022-10-18)

**Note:** Version bump only for package @wundergraph/sdk

## [0.116.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.115.0...@wundergraph/sdk@0.116.0) (2022-10-18)

### Features

* add configurable per-source timeouts ([#232](https://github.com/wundergraph/wundergraph/issues/232)) ([bb3b6bd](https://github.com/wundergraph/wundergraph/commit/bb3b6bd31250b402fe0c9a099b0dad993976cf39)) (@fiam)
* align logging format hooks server and ([#240](https://github.com/wundergraph/wundergraph/issues/240)) ([e601d4c](https://github.com/wundergraph/wundergraph/commit/e601d4c1597a949c2c564a5b953b4424dae5ee7c)) (@spetrunin)
* subscriptions, ws connection init hook ([#243](https://github.com/wundergraph/wundergraph/issues/243)) ([2e4ae85](https://github.com/wundergraph/wundergraph/commit/2e4ae8506558165a9bf3ada4b8f45cee55a9f18d)) (@YuriBuerov)

### Bug Fixes

* fix mutations are possibly undefined ([#265](https://github.com/wundergraph/wundergraph/issues/265)) ([cea8607](https://github.com/wundergraph/wundergraph/commit/cea860703a1f76a63dae292770514218624ce3a1)) (@JivusAyrus)

## [0.115.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.114.6...@wundergraph/sdk@0.115.0) (2022-10-12)

### Features

* refactor cache handling, move storage out of generated ([#238](https://github.com/wundergraph/wundergraph/issues/238)) ([6351e35](https://github.com/wundergraph/wundergraph/commit/6351e35419215b4bc63bce4a80e16e20d8e9d2d0)) (@fiam)

### Bug Fixes

* correctly generate typenames for nested array objects ([#257](https://github.com/wundergraph/wundergraph/issues/257)) ([ca61274](https://github.com/wundergraph/wundergraph/commit/ca612747122195a826b9362e24765b66562e06cf)) (@jensneuse)
* live query support in generated web client ([#248](https://github.com/wundergraph/wundergraph/issues/248)) ([a1bc5f5](https://github.com/wundergraph/wundergraph/commit/a1bc5f5fe5182d87759ea895257e1f643e472e4a)), closes [#78](https://github.com/wundergraph/wundergraph/issues/78) (@xzyfer)

## [0.114.6](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.114.5...@wundergraph/sdk@0.114.6) (2022-10-10)

**Note:** Version bump only for package @wundergraph/sdk

## [0.114.5](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.114.4...@wundergraph/sdk@0.114.5) (2022-10-07)

### Bug Fixes

* automatically rename subscription object fields for oas ([#246](https://github.com/wundergraph/wundergraph/issues/246)) ([aaf018e](https://github.com/wundergraph/wundergraph/commit/aaf018e038758dcf5f79c9ee42641a9c562d5a70)) (@jensneuse)

## [0.114.4](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.114.3...@wundergraph/sdk@0.114.4) (2022-10-07)

### Bug Fixes

* **sdk/client:** include extra headers from constructor ([#244](https://github.com/wundergraph/wundergraph/issues/244)) ([d59e3ab](https://github.com/wundergraph/wundergraph/commit/d59e3ab1d90c82a2971253e6afdc793d6f6e3f46)) (@chronotc)
* **sdk:** add fastify route only if the hook is configured ([#204](https://github.com/wundergraph/wundergraph/issues/204)) ([4d744a3](https://github.com/wundergraph/wundergraph/commit/4d744a3c3923b9c0db926ea393cbba821b4b8b74)) (@JivusAyrus)

## [0.114.3](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.114.2...@wundergraph/sdk@0.114.3) (2022-10-04)

### Bug Fixes

* introspection, infinite loop in file changes ([#230](https://github.com/wundergraph/wundergraph/issues/230)) ([4fdf635](https://github.com/wundergraph/wundergraph/commit/4fdf6352bddd63125be673f55808f4d8493299b8)) (@YuriBuerov)

## [0.114.2](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.114.1...@wundergraph/sdk@0.114.2) (2022-09-30)

### Bug Fixes

* re-enable to specify wundergraph dir via arg ([#226](https://github.com/wundergraph/wundergraph/issues/226)) ([50cb5f2](https://github.com/wundergraph/wundergraph/commit/50cb5f22468fa481089caeba9935ee65e9dfe1f3)) (@jensneuse)

## [0.114.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.114.0...@wundergraph/sdk@0.114.1) (2022-09-29)

**Note:** Version bump only for package @wundergraph/sdk

## [0.114.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.113.2...@wundergraph/sdk@0.114.0) (2022-09-29)

### Features

*  add graphql introspection middleware ([#214](https://github.com/wundergraph/wundergraph/issues/214)) ([33e840c](https://github.com/wundergraph/wundergraph/commit/33e840c995c5d482e6e755d19bbd76b006d19f3c)) (@spetrunin)
* sse subscriptions configuration ([#217](https://github.com/wundergraph/wundergraph/issues/217)) ([7bf72ef](https://github.com/wundergraph/wundergraph/commit/7bf72efd16a8bac422db32fe957e102395d7357c)) (@YuriBuerov)

### Bug Fixes

* allow to configure internal and public node urls separately ([#207](https://github.com/wundergraph/wundergraph/issues/207)) ([c01bd9a](https://github.com/wundergraph/wundergraph/commit/c01bd9a1cedefbb5fd0ecde83f3b96b3dfee6f41)) (@spetrunin)
* synchronize prisma install for multiple prisma datasources ([#222](https://github.com/wundergraph/wundergraph/issues/222)) ([9ca1fc9](https://github.com/wundergraph/wundergraph/commit/9ca1fc9d3f75ce381bafd4f895c8fb803547a932)) (@jensneuse)

## [0.113.2](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.113.1...@wundergraph/sdk@0.113.2) (2022-09-26)

### Bug Fixes

* **cache:** dont print dev messages in prod mode ([#208](https://github.com/wundergraph/wundergraph/issues/208)) ([b22c32a](https://github.com/wundergraph/wundergraph/commit/b22c32ab7f2705b19ad537f76dfef43d589fd026)) (@StarpTech)
* **codegen:** resolve template dependencies recursively ([#209](https://github.com/wundergraph/wundergraph/issues/209)) ([283a9c8](https://github.com/wundergraph/wundergraph/commit/283a9c8db4c28f8fb1177fd68aa6a55acc98e8a0)) (@StarpTech)

## [0.113.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.113.0...@wundergraph/sdk@0.113.1) (2022-09-22)

**Note:** Version bump only for package @wundergraph/sdk

## [0.113.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.112.0...@wundergraph/sdk@0.113.0) (2022-09-21)

### Features

* add auth example for swr ([#200](https://github.com/wundergraph/wundergraph/issues/200)) ([7a5f34e](https://github.com/wundergraph/wundergraph/commit/7a5f34e8c80141f400a9b6ed195d04a22a86c92b)) (@StarpTech)

## [0.112.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.111.0...@wundergraph/sdk@0.112.0) (2022-09-21)

### Features

* add post logout hook ([#196](https://github.com/wundergraph/wundergraph/issues/196)) ([6870130](https://github.com/wundergraph/wundergraph/commit/6870130b0c4e6fc269d81160994384c1d1cf6e59)) (@jensneuse)

## [0.111.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.110.0...@wundergraph/sdk@0.111.0) (2022-09-20)

### Features

* add swr hooks for auth and file upload ([#195](https://github.com/wundergraph/wundergraph/issues/195)) ([a0b1bae](https://github.com/wundergraph/wundergraph/commit/a0b1bae6a18e30fcefc35bdde2f72326f3de1392)) (@StarpTech)

## [0.110.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.109.0...@wundergraph/sdk@0.110.0) (2022-09-19)

### Features

* make typescript client typesafe ([#179](https://github.com/wundergraph/wundergraph/issues/179)) ([942b278](https://github.com/wundergraph/wundergraph/commit/942b2782255de3b9e6374500c7a8047de074e4ff)), closes [#188](https://github.com/wundergraph/wundergraph/issues/188) (@Pagebakers)

## [0.109.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.108.0...@wundergraph/sdk@0.109.0) (2022-09-19)

### Features

* implement config first approach ([#151](https://github.com/wundergraph/wundergraph/issues/151)) ([803da0e](https://github.com/wundergraph/wundergraph/commit/803da0e51beb3a7b23ee826dfde835eccfa1c2dd)), closes [#190](https://github.com/wundergraph/wundergraph/issues/190) (@spetrunin)

### Bug Fixes

* update User interface on client to parse json correctly ([#176](https://github.com/wundergraph/wundergraph/issues/176)) ([f80e410](https://github.com/wundergraph/wundergraph/commit/f80e410530433c6c9b1c290abca2e51b1e7ea907)) (@thisisnithin)

## [0.108.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.107.1...@wundergraph/sdk@0.108.0) (2022-09-15)

### Features

* allow templates in baseURL for openapi ([#183](https://github.com/wundergraph/wundergraph/issues/183)) ([cb279e7](https://github.com/wundergraph/wundergraph/commit/cb279e7829e704d75a1bcea5a87c42b09331c624)) (@jensneuse)
* custom stable hash function for js values ([#182](https://github.com/wundergraph/wundergraph/issues/182)) ([c16c635](https://github.com/wundergraph/wundergraph/commit/c16c635dd6c6ee5a9784e83b4063941b8e3f3435)) (@StarpTech)

## [0.107.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.107.0...@wundergraph/sdk@0.107.1) (2022-09-15)

**Note:** Version bump only for package @wundergraph/sdk

## [0.107.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.106.0...@wundergraph/sdk@0.107.0) (2022-09-14)

### Features

* oidc,  allow passing additional query parameters to the IDP ([#178](https://github.com/wundergraph/wundergraph/issues/178)) ([d015bb1](https://github.com/wundergraph/wundergraph/commit/d015bb150762cba7a46865e66f3de633e731de07)) (@YuriBuerov)

## [0.106.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.105.1...@wundergraph/sdk@0.106.0) (2022-09-09)

### Features

* add golang client ([#170](https://github.com/wundergraph/wundergraph/issues/170)) ([a26bc32](https://github.com/wundergraph/wundergraph/commit/a26bc32d4a178134f893012ca4e2648460b4e7f8)) (@jensneuse)

## [0.105.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.105.0...@wundergraph/sdk@0.105.1) (2022-09-08)

**Note:** Version bump only for package @wundergraph/sdk

## [0.105.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.104.0...@wundergraph/sdk@0.105.0) (2022-09-08)

### Features

* improve webhook types ([#173](https://github.com/wundergraph/wundergraph/issues/173)) ([8cb6d97](https://github.com/wundergraph/wundergraph/commit/8cb6d9750f6e14e2fdd3d87ad97ca0cf3236f95b)) (@StarpTech)

## [0.104.0](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.103.1...@wundergraph/sdk@0.104.0) (2022-09-06)

### Features

* ensure that user is always set in auth hooks, disable introspection cache in `wunderctl generate` ([#167](https://github.com/wundergraph/wundergraph/issues/167)) ([4b40572](https://github.com/wundergraph/wundergraph/commit/4b40572dd993be1c84e421f1796eb8a2913ecf69)) (@StarpTech)

### Bug Fixes

* sync wunderctl ([06dfe11](https://github.com/wundergraph/wundergraph/commit/06dfe11e885acafe48b6d7e8776cb763f0c75a66)) (@StarpTech)

## [0.103.1](https://github.com/wundergraph/wundergraph/compare/@wundergraph/sdk@0.103.0...@wundergraph/sdk@0.103.1) (2022-09-05)

### Bug Fixes

* fixes open api errors for int based enums and json fields ([#164](https://github.com/wundergraph/wundergraph/issues/164)) ([a79fe3e](https://github.com/wundergraph/wundergraph/commit/a79fe3ebc8c0b8d863123d565edfe0942f03048d)) (@rpeterson)

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
