# Migration steps

| Version range   | Migration complexity | Info                          |
| --------------- | -------------------- | ----------------------------- |
| 0.123.0-0.124.0 | low                  | Application class was removed |

1. `Application` class has been removed. Instead, pass you APIs directly to `configureWunderGraphApplication()`:

```diff
-const myApplication = new Application({
-  name: 'app',
-  apis: [jsp, weather, countries, spacex, chinook, db],
-})
-
 configureWunderGraphApplication({
-  application: myApplication,
+  apis: [jsp, weather, countries, spacex, chinook, db],
 })
```

2. URL structure has changed, removing the `/app/main` prefix. Regenerate your app with `wunderctl generate`
   or `wunderctl up`.
