# Migration steps

| Version range   | Migration complexity | Info                          |
| --------------- | -------------------- | ----------------------------- |
| 0.163.3-0.164.4 | low                  | New `RequestLogger` interface |

# Migrate to the new RequestLogger interface

1. Update your calls to logging methods (`.debug()`, `.info()`, etc...) to always use a string as the
   first argument.
2. If you had any references to `WebhookLogger` or `FastifyLoggerInstance`, you will have to replace them
   with `RequestLogger`.
