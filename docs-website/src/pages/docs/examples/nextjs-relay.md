The [Next.js + Relay example](https://github.com/wundergraph/wundergraph/tree/main/examples/nextjs-relay) demonstrates how to use Relay with a Next.js based WunderGraph project.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

## Using WunderGraph with SSR

Create the utility functions needed to work with Relay

```ts
// in src/lib/wundergraph/index.ts
export const { WunderGraphRelayProvider, useLiveQuery, fetchWunderGraphSSRQuery } = createWunderGraphRelayApp({
  client,
});
```

Wrap your `_app.tsx` with `WunderGraphRelayProvider`

```tsx
// in src/pages/_app.tsx
export default function App({ Component, pageProps }: AppProps) {
  return (
    <WunderGraphRelayProvider initialRecords={pageProps.initialRecords}>
      <Component {...pageProps} />
    </WunderGraphRelayProvider>
  );
}
```

In your pages, use `fetchWunderGraphSSRQuery` inside `getServerSideProps` to fetch data on the server

```tsx
// in src/pages/index.tsx
export async function getServerSideProps() {
  const relayData = await fetchWunderGraphSSRQuery<PagesDragonsQueryType>(PagesDragonsQuery);

  return {
    props: relayData,
  };
}
```

## Learn more about WunderGraph + Relay

To learn more about WunderGraph Relay integration, read our [Quickstart Guide](/docs/getting-started/relay-quickstart)

## Learn More about Next.js

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

[![Deploy to WunderGraph](https://wundergraph.com/button)](https://cloud.wundergraph.com/new/clone?templateName=nextjs-relay)
