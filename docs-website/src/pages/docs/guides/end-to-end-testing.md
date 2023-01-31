---
title: End to end testing
pageTitle: WunderGraph - End to end testing
description: This guide shows how to test your WunderGraph applications
---

## End to end testing

While WunderGraph does not provide any end to end testing libraries itself, it does fully
support using [PlayWright](https://playwright.dev).

## Initial setup

Follow the [official instructions](https://playwright.dev/docs/intro) from PlayWright, which
will set up an example test for you.

Configure your PlayWright to start your WunderGraph application by editing `playwright.config.ts`.
Look for `webServer` and add the following lines:

```javascript
webServer: {
    /*
        Run both your backend (via wunderctl up) and your frontend.
        See the example at the bottom for more details.
    */
    command: 'npm start',
    port: 3000,
},
```

## Run your tests

First, install PlayWright browser engines with:

```sh
npx -- playwright install --with-deps
```

And finally start your tests by running:

```sh
npx -- playwright test
```

## Resources

- [NextJS example](https://github.com/wundergraph/wundergraph/tree/main/examples/nextjs)
