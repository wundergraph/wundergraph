# Migration steps

| Version range   | Migration complexity | Info                            |
| --------------- | -------------------- | ------------------------------- |
| 0.134.0-0.135.0 | low                  | `User` fields renamed / removed |

# Rename removed/renamed field usages in hooks and functions

1. Field `description` in `User` has been removed. If you need to read this field, use a custom claim instead.
2. Field `avatarUrl` in `User` has been renamed to `picture`, to follow JWT claim conventions better.
