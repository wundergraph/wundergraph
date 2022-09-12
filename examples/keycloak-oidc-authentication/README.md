# WunderGraph Example with Keycloak OpenID Connect Authentication

## Getting Started

### 1. Get Auth0 credentials:

1. Go to [Github profile settings](https://github.com/settings/developers) and create a new OAuth app.
2. Generate client secret
3. Set authorization callback URL to: ... , and home page URL to: ...
4. Copy the `Client ID` and `Client Secret` to the clipboard
5. Rename the `.example.env` file to `.env`
6. Paste the credentials into the `.env` file

### 2. Install & Start

Run keycloak:

```shell
docker compose up -d --wait
```

Install the dependencies and run the complete example in one command:

```shell
npm install && npm start
```

### 3. Use the application

On the NextJS frontend, click the "Login" button.
Once the login is complete, the Frontend will automatically fetch the data and inject the bearer token into the origin request.

[Keycloak console](http://localhost:8080/) user name: admin, password: admin

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
