# Migration steps

| Version range | Migration complexity | Info                              |
| ------------- | -------------------- | --------------------------------- |
| From 0.112.0  | low                  | (CLI flags) Changing global flags |

In this cli version a couple of flags were renamed and changed behaviour.

## wunderctl

| Flag                 | New Flag name  | Usage                                              |
| -------------------- | -------------- | -------------------------------------------------- |
| loglevel             | cli-log-level  | Sets desired cli log level                         |
| json-encoded-logging | pretty-logging | Enables pretty logging, default logs format - json |
| debug                | debug          | Forces all components to use log level `debug`     |
