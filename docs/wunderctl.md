# Wundergraph CLI

## wunderctl generate

### Mandatory environment variables

| Variable name    | Description                                        | Default value           |
| ---------------- | -------------------------------------------------- | ----------------------- |
| `WG_LOG_LEVEL`   | The log level of the WundeNode/WunderGraph Server. | `info`                  |
| `WG_NODE_URL`    | The URL of the WunderNode.                         | `http://localhost:9991` |
| `WG_NODE_HOST`   | The host of the WunderNode.                        | `localhost`             |
| `WG_NODE_PORT`   | The port of the WunderNode.                        | `9991`                  |
| `WG_SERVER_URL`  | The URL of the WunderGraph Server.                 | `http://localhost:9992` |
| `WG_SERVER_HOST` | The host of the WunderGraph Server.                | `localhost`             |
| `WG_SERVER_PORT` | The port of the WunderGraph Server.                | `9992`                  |

### Environment variables required for the cloud run

| Variable name | Description                                         | Default value |
| ------------- | --------------------------------------------------- | ------------- |
| `WG_CLOUD`    | Forces to use default env variables for the config. | unset         |

## wunderctl node start

### Mandatory environment variables

| Variable name   | Description                                        | Default value           |
| --------------- | -------------------------------------------------- | ----------------------- |
| `WG_LOG_LEVEL`  | The log level of the WundeNode/WunderGraph Server. | `info`                  |
| `WG_NODE_HOST`  | The host of the WunderNode.                        | `localhost`             |
| `WG_NODE_PORT`  | The port of the WunderNode.                        | `9991`                  |
| `WG_SERVER_URL` | The URL of the WunderGraph Server.                 | `http://localhost:9992` |

## wunderctl server start

### Mandatory environment variables

| Variable name    | Description                                         | Default value           |
| ---------------- | --------------------------------------------------- | ----------------------- |
| `WG_LOG_LEVEL`   | The log level of the WunderNode/WunderGraph Server. | `info`                  |
| `WG_NODE_URL`    | The URL of the WunderNode.                          | `http://localhost:9991` |
| `WG_SERVER_HOST` | The host of the WunderGraph Server.                 | `localhost`             |
| `WG_SERVER_PORT` | The port of the WunderGraph Server.                 | `9992`                  |
