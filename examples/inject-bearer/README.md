# WunderGraph Example to Inject a Bearer Token with Auth0

## Getting Started

### 1. Get Auth0 credentials:

1. Go to [Auth0](https://auth0.com/) and create a new application of type "Regular Web Application"
2. Skip the Quickstart
3. Copy the `Issuer`, `Client ID` and `Client Secret` to the clipboard
4. Rename the `.env.example` file to `.env`
5. Paste the credentials into the `.env` file
6. Set the Callback URL on Auth0 to http://localhost:9991/auth/cookie/callback/auth0

### 2. Install & Start

Install the dependencies and run the complete example in one command:

```shell
npm install && npm start
```

### 3. Use the application

On the NextJS frontend, click the "Login" button.
Once the login is complete, the Frontend will automatically fetch the data and inject the bearer token into the origin request.

### How does it work?

Check out the `.wundergraph/wundergraph.server.ts` file.
We've added a global onRequest hook to inject the raw ID token of the user into the origin request.
You can modify this logic and add other Headers into your origin requests.

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Deploy to WunderGraph Cloud

[![Deploy to WunderGraph](https://wundergraph.com/button)](https://cloud.wundergraph.com/new/clone?templateName=inject-bearer)

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
