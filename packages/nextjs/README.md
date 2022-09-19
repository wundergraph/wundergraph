# Wundergraph Next.js integration

![wunderctl](https://img.shields.io/npm/v/@wundergraph/nextjs.svg)

WunderGraph codegen template plugin to add deep Next.js integration.

> **Warning**: Only works with WunderGraph.

## Getting Started

```shell
npm install @wundergraph/nextjs
```

### 1. Register the codegen template

```ts
// .wundergraph/wundergraph.config.ts
import { NextJsTemplate } from '@wundergraph/nextjs/dist/template';

configureWunderGraphApplication({
  // ...
  // omitted for brevity
  codeGenerators: [
    {
      templates: [new NextJsTemplate()],
    },
  ],
});
```

### 2. Import the package

```tsx
// pages/authentication.ts
import { useQuery, useMutation, useLiveQuery, AuthProviders } from '.wundergraph/generated/nextjs';

const Example: ExamplePage = () => {
  const { user, login, logout } = useWunderGraph();
  const onClick = () => {
    if (user === null || user === undefined) {
      login(AuthProviders.github);
    } else {
      logout();
    }
  };
  return (
    <div>
      <h1>Authentication</h1>
      <button onClick={onClick}>${user ? logout : login}</button>
      <p>{JSON.stringify(user)}</p>
    </div>
  );
};
export default withWunderGraph(Example);
```
