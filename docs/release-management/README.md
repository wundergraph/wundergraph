# Releases

This document describes the process of deploying the entire monorepo.
This monorepo is a collection of NPM packages and a single go application.

### NPM Packages

We use [changesets](https://github.com/changesets/changesets) to manage the publication and versioning of our packages.

If you want to publish a new version of an NPM package, you can do so by following:

1. On `main` or on a PR run `pnpm changeset:add` to define which packages were changed with which [semver](https://semver.org/lang/de/).
2. Commit and merge the changes. The workflow `changesets` is triggered and creates a PR `[ci] release` with the changes.
3. Approve the PR and merge to `main`. The changes are detected by the `changesets` workflow and deployed to the NPM registry. It also creates a Github Release for each npm package.

> **Note**: The NPM package `wunderctl` is a wrapper for the wunderctl binary. We use a different deployment workflow to make the deployment of both applications atomic. Don't publish the `@wundergraph/wunderctl` package manually.

### Wunderctl & Wrapper

We use [GoReleaser](https://goreleaser.com/) to release the wunderctl application and [release-it](https://github.com/release-it/release-it) only for tagging.

If you want to publish a new version of Wunderctl, you can do so by following:

1. Create a tag with `pnpm engine:release` and follow the instructions (all yes).
2. [GoReleaser](https://goreleaser.com/) workflows are triggered and creates a Github Release with the changes.
3. The `wunderctl-changesets` workflow is triggered and creates a PR `[ci] wunderctl release` with the changes.
4. Approve the PR and merge to `main`. The changes are detected by the `wunderctl-changesets` workflow and deployed to the NPM registry. It also creates a Github Release for the `wunderctl` npm package.

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
