# Migration steps from wunderctl 0.106.3 to 0.107.0

In this cli version a couple of flags were removed and a new commands were added.

## wunderctl generate

| Flag                   | Description | Usage                                                                                  |
| ---------------------- | ----------- | -------------------------------------------------------------------------------------- |
| listen-addr            | removed     | to change use options.listen.host and options.listen.port in `wundergraph.config.ts`   |
| middleware-listen-port | removed     | to change use options.listen.port in `wundergraph.server.ts`                           |
| entrypoint             | removed     | it is no longer possible to override default entrypoint `wundergraph.config.ts`        |
| serverEntryPoint       | removed     | it is no longer possible to override default server entrypoint `wundergraph.server.ts` |

## wunderctl up

| Flag                   | Description | Usage                                                                                             |
| ---------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| listen-addr            | removed     | to change use options.listen.host and options.listen.port in `wundergraph.config.ts`              |
| middleware-listen-port | removed     | to change use options.listen.port in `wundergraph.server.ts`                                      |
| config                 | removed     | it is no longer possible to override default generated config file name `wundergraph.config.json` |
| entrypoint             | removed     | it is no longer possible to override default entrypoint `wundergraph.config.ts`                   |
| serverEntryPoint       | removed     | it is no longer possible to override default server entrypoint `wundergraph.server.ts`            |

## wunderctl start

| Flag                   | Description | Usage                                                                                             |
| ---------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| listen-addr            | removed     | to change use options.listen.host and options.listen.port in `wundergraph.config.ts`              |
| middleware-listen-port | removed     | to change use options.listen.port in `wundergraph.server.ts`                                      |
| config                 | removed     | it is no longer possible to override default generated config file name `wundergraph.config.json` |
| entrypoint             | removed     | it is no longer possible to override default entrypoint `wundergraph.config.ts`                   |
| serverEntryPoint       | removed     | it is no longer possible to override default server entrypoint `wundergraph.server.ts`            |

## New commands was added

### wunderctl node start

Starts a WunderNode in production mode. No flags are required.

Requires:

- `wundergraph.config.json` to be present in the `.wundegraph` directory.

Before use please run `wunderctl generate` to generate the config file.

### wunderctl server start

Starts a WunderGraph Server in production mode. No flags are required.

Requires:

- `wundergraph.config.json` to be present in the `.wundegraph` directory.
- `"generated/bundle/server.js"` to be present in the `.wundegraph` directory.

Before use please run `wunderctl generate` to generate the config and server files.
