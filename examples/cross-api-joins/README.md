# WunderGraph cross API joins example

#### Getting started

```shell
npm install && npm start
```

#### Get weather for a country capital

```shell
curl -v --get --data-urlencode 'wg_variables={"countryCode": "ES"}' 'http://localhost:9991/operations/CountryWeather'
```

## Test the API

1. (Optional) Copy the `.env.example` file to `.env.test` and fill in the required values.
2. Run the following command:

```shell
npm run test
```

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Deploy to WunderGraph Cloud

[![Deploy to WunderGraph](https://wundergraph.com/button)](https://cloud.wundergraph.com/new/clone?templateName=cross-api-joins)

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
