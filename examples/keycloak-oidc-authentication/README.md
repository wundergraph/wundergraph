# WunderGraph Example with Keycloak OpenID Connect Authentication

## Getting Started

### 1. Get GitHub OAuth2 app credentials:

1. Go to [GitHub profile settings](https://github.com/settings/developers) and create a new OAuth app.
2. Generate client secret
3. Set authorization callback URL to: `http://localhost:8080/realms/demo/broker/github/endpoint`, and home page URL to: `http://localhost:3000`
4. Rename the `.example.env` file to `.env`
5. Copy `Client ID` as set it as `GITHUB_APP_CLIENT_ID` in the `.env` file
6. Click on `Generate a new client secret` copy the secret and set as `GITHUB_APP_CLIENT_SECRET` in the `.env` file

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

### 4. Keycloak console

- `http://localhost:8080/`
- user name: admin
- password: admin

### 5. (Optional): Populating User.roles with Keycloak Client and Realm Roles

By default, Keycloak roles are exposed through `realm_access.roles` and `resource_access.<client_id>.roles` claims. If you wish to populate the `User.roles` field with these roles, you will need to configure Keycloak's mapper settings accordingly.

Follow these steps to achieve this configuration:

1. Open the Keycloak admin console and select the `demo` realm.
2. Navigate to `Clients Scope` > `roles` > `Mappers` > `realm roles` and perform the following configuration:
   - Set **Token Claim Name** to `roles`.
   - Ensure all switch prefixed with **Add to ...** are enabled.
3. Do the same for `client roles` under the same Mappers tab.

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
