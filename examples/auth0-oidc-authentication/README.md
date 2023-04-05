# WunderGraph Example with Auth0 OpenID Connect Authentication

## Getting Started

### 1. Get Auth0 credentials:

1. Go to [Auth0](https://auth0.com/) and create a new application of type "Regular Web Application"
2. Skip the Quickstart
3. Copy the `Issuer`, `Client ID` and `Client Secret` to the clipboard
4. Rename the `.env.example` file to `.env`
5. Paste the credentials into the `.env` file
6. Set _Allowed Callback URLs_ on Auth0's app settings dashboard to `http://localhost:9991/auth/cookie/callback/auth0`
7. Set _Allowed Logout URLs_ on Auth0's app settings dashboard to `http://localhost:3000`

### 2. Install & Start

1. Copy the `.env.example` file to `.env` and fill in the required values.
2. Install the dependencies and run the complete example in one command:

```shell
npm install && npm start
```

### 3. Use the application

On the NextJS frontend, click the "Login" button.
Once the login is complete, the Frontend will automatically fetch the data and inject the bearer token into the origin request.

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Deploy to WunderGraph Cloud

[![Deploy to WunderGraph](https://wundergraph.com/button)](https://cloud.wundergraph.com/new/clone?templateName=auth0-oidc-authentication)

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
