# WunderGraph Example with Clerk Authentication

## Getting Started

### 1. Get Clerk credentials:

1. Go to [Clerk](https://clerk.com/) and create a new application or use an existing one.
2. On your application dashboard to to `API Key`
3. Use the `Quick Copy` for Next.js and copy the `.env.local`
4. Create a new `.env.local` file in the root folder (next to the `package.json`)
5. Paste the credentials into the `.env.local` file
6. Go to `JWT Templates` and create a new `Blank` template
7. Name it `wundergraph`
8. Use the following template: (You can also include other claims as needed)

```json
{
  "id": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "lastName": "{{user.last_name}}",
  "username": "{{user.username}}",
  "firstName": "{{user.first_name}}"
}
```

9. Copy the JWKS Endpoint url
10. Add a new environment variable to `.env.local` called `CLERK_JWKS_URL` and paste the url as the value

### 2. Install & Start

1. Install the dependencies and run the complete example in one command:

```shell
npm install && npm start
```

### 3. Use the application

On the NextJS frontend, click the "Login" button.
Once the login is complete, the Frontend will automatically fetch the data and inject the bearer token into the origin request.

## Learn More

- [WunderGraph Docs](https://docs.wundergraph.com/docs/auth/token-based-auth/clerk).
- [Clerk Docs](https://clerk.com/docs)

## Deploy to WunderGraph Cloud

[![Deploy to WunderGraph](https://wundergraph.com/button)](https://cloud.wundergraph.com/new/clone?templateName=nextjs-clerk)

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
