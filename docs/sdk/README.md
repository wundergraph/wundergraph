# SDK

## Better type support

If you test the SDK locally, add this to your `tsconfig.json`. This will improve the local development experience.

```json
{
  "compilerOptions": {
    "paths": {
      "@wundergraph/sdk": [
        "<path-to-the-sdk>/src"
      ]
    }
  }
}
```