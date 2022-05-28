# Releases

This document describes the process of deploying the entire monorepo.
This monorepo is a collection of NPM packages and a single go application.

### NPM Packages

We use [changesets](https://github.com/changesets/changesets) to manage the publication and versioning of our packages.

If you want to publish a new version of an NPM package, you can do so by following:

1. On `main` or on a PR run `pnpm changeset:add` to define which packages were changed with which [semver](https://semver.org/lang/de/).
2. Commit and merge the changes. The workflow `changesets` is triggered and creates a PR `ci: release` with the changes.
3. Approve the PR and merge to `main`. The changes are detected by the `changesets` workflow and deployed to the NPM registry. It also creates a Github Release for each npm package.

### Wunderctl wrapper

The NPM package `@wundergraph/wunderctl` is a wrapper for the wunderctl binary. We release it with the wunderctl Go binary to make the deployment of both applications atomic. **Don't publish** this package manually.
The package is released as soon as the wunderctl binary is published.

### Wunderctl & SDK

We use [GoReleaser](https://goreleaser.com/) to release the wunderctl application and [release-it](https://github.com/release-it/release-it) only for tagging.
The [`@wundergraph/sdk`](https://github.com/wundergraph/wundergraph/tree/main/packages/sdk) package is required for all WunderGraph applications. After installing this package, it will download the compatible `wunderctl` version. This relationship makes it necessary to release the wunderctl binary first before releasing an incompatible SDK change.
You can define what `wunderctl` version is required for the SDK by modifying the `engines.wundergraph` property in the `package.json`.

If you want to publish a new version of Wunderctl, you can do so by following:

1. Create a tag with `pnpm engine:release` and follow the instructions (all yes).
2. [GoReleaser](https://goreleaser.com/) workflows are triggered and creates a Github Release with the changes.
3. Did you introduce a breaking-change between wunderctl and SDK? Follow [NPM packages](https://github.com/wundergraph/wundergraph/tree/main/docs/release-management#npm-packages) to publish the [`@wundergraph/sdk`](https://github.com/wundergraph/wundergraph/tree/main/packages/sdk) package.

## Next Releases

### NPM Packages

1. Run `pnpm enter-next`
2. Follow the same instruction as in [NPM packages](#npm-packages) starting with Step 1).
3. Leave the next mode to switch to stable releases with `pnpm exit-next`.

### Wunderctl & Wrapper

1. Run `pnpm engine:release-next` and follow the instructions.
2. Follow the same instruction as in [Wunderctl & Wrapper](#wunderctl--wrapper) starting with Step 2).


## Limits

- Only one NPM release can be running at a time.
