# Publish your API to the WunderHub

WunderHub is the **The Package Manager for APIs**.

Search APIs and integrate them into your WunderGraph Application with a single command.
The best way for API providers to get their APIs into the hands of developers.

#### Getting started

> **Note**: You need a [WunderHub](https://hub.wundergraph.com/) account to publish APIs.

1. Install the workspace

```shell
npm install
```

2. Login to WunderHub `npm run wunderctl login`.
3. Modify the `.wundergraph/wundergraph.config.ts` with your Organization, API information.
4. Generate your API:

```shell
npm run generate
```

5. Publish your API to the WunderHub:

```shell
npm run wunderctl publish <organization/api>
```

#### Install API dependencies

```shell
npm run wunderctl add <api-name>
```

For a more detailed guide, see [WunderHub Start](https://hub.wundergraph.com/start).
