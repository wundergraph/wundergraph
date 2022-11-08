# create-wundergraph-app

The best way to start with Wundergraph is by using `create-wundergraph-app`. This CLI tool enables you to start with one of the examples/templates provided in the Wundergraph Repository. It even enables you to start with templates provided by the community using the github link.

## Local Development

```shell
pnpm install
pnpm build
```

## Usage

```shell
npx create-wundergraph-app --help
npx create-wundergraph-app --version
npx create-wundergraph-app <project-name>
npx create-wundergraph-app <project-name> -E <example-name>
npx create-wundergraph-app <project-name> -L <github-link>
```

## Local Usage

```shell
node ./dist/index.js --help
node ./dist/index.js --version
node ./dist/index.js <project-name>
node ./dist/index.js <project-name> -E <example-name>
node ./dist/index.js <project-name> -L <github-link>
```
