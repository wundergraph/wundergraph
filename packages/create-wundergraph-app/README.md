# create-wundergraph-app

The best way to start with Wundergraph is by using `create-wundergraph-app`. This CLI tool enables you to start with one of the examples/templates provided in the Wundergraph Repository. It even enables you to start with templates provided by the community using the github link.

## Local Development

The project has an environment variable called GITHUB_TOKEN that can be used to increase the rate limit of GitHub APIs.

```shell
pnpm install
pnpm build
```

## Usage

```shell
npx create-wundergraph-app --help
npx create-wundergraph-app --version
```

### Clone an example from the official WunderGraph Repository

```shell
npx create-wundergraph-app <project-name>
npx create-wundergraph-app <project-name> -E <example-name>
```

### Clone an arbitrary WunderGraph Template Repository

```shell
npx create-wundergraph-app <project-name> -L <github-link>
```

## Local Usage

```shell
node ./dist/src/index.js --help
node ./dist/src/index.js --version
node ./dist/src/index.js <project-name>
node ./dist/src/index.js <project-name> -E <example-name>
node ./dist/src/index.js <project-name> -L <github-link>
```
