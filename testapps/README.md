# Wundergraph Internal Test applications

This directory contains a number of test applications inside a pnpm workspace to been able to test applications work with sdk from source code.

## Test applications

| Name     | Description                                                                                                                             | Purpose                                    |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| default  | Backend application including `json-placeholder`, `federation`, `spacex`, `countries`, `weather`, `chinook db`, `simple sqlite db` apis | Test complex configuration                 |
| simple   | Backend application skeleton with a single mocked operation.                                                                            | Test any custom configuration from scratch |
| postgres | tbd                                                                                                                                     | tbd                                        |
| nextjs   | tbd                                                                                                                                     | tbd                                        |
| vite     | tbd                                                                                                                                     | tbd                                        |

Those applications are used to test the sdk from source code. They are not meant to be used as a reference for a production application.
Additionally, every scenario that can be persisted in a test application should be added to the integration tests [`testsuite`](../packages/testsuite).
