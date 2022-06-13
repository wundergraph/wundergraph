# SDK

The WunderGraph SDK is the easiest way to configure your WunderGraph applications. It's written in TypeScript and allows you to configure every aspect of your WunderGraph applications via Code.

## Better type support

If you test the SDK locally, add this to your `tsconfig.json`. This will improve the local development experience.

```json
{
  "compilerOptions": {
    "paths": {
      "@wundergraph/sdk": ["<path-to-the-sdk>/src"]
    }
  }
}
```
