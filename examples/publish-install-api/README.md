# Publish & Consume APIs from WunderHub

[WunderHub](https://hub.wundergraph.com/) is the **The Package Manager for APIs**.

Search APIs and integrate them into your WunderGraph Application with a single command.
The best way for API providers to get their APIs into the hands of developers.

## 💻 Getting started

Install the workspace

```shell
npm install
```

### Consume APIs from the Hub

1. Install all API dependencies in [`wundergraph.manifest.json`](./.wundergraph/wundergraph.manifest.json):

```shell
npm run wunderctl
```

2. Start your WunderGraph server

```shell
npm run start
```

3. Fetch dragons and weather data:

```shell
curl -X GET http://localhost:9991/app/main/operations/DragonsAndWeather
```

> **Note**: 🎓 For a more detailed example, see [WunderHub Start](https://hub.wundergraph.com/start).

### Publish your API

> **Note**: You need a [WunderHub](https://hub.wundergraph.com/) account to publish APIs.

1. Login to WunderHub `npm run wunderctl login`.
2. Modify the `.wundergraph/wundergraph.config.ts` with your Organization, API information.
3. Generate your API:

```shell
npm run generate
```

4. Publish your API to the WunderHub:

```shell
npm run wunderctl publish <organization/api>
```

🚀 After few minutes, your API will be available on the [WunderHub Catalog](https://hub.wundergraph.com/catalog).
