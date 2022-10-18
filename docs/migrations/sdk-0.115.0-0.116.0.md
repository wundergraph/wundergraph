# Migration steps

| Version range   | Migration complexity | Info                                      |
| --------------- | -------------------- | ----------------------------------------- |
| 0.115.0-0.116.0 | low                  | Webhooks Logger renamed to WebhookLogger. |

1. Webhooks exported type Logger was renamed to WebhookLogger:

If you have such import in your webhooks code:

```ts
import { Logger } from '@wundergraph/sdk';
```

Change it to next one:

```ts
import { WebhookLogger } from '@wundergraph/sdk';
```
