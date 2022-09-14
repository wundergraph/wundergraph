# Releases

This document describes the process of deploying the entire monorepo.
This monorepo is a collection of NPM packages and a single go application.

### NPM Packages

We use [Lerna](https://github.com/lerna/lerna) to manage the publication and versioning of our packages.

If you want to publish a new version of an NPM package, you can do so by following:

1. Check the
   workflow [Releases Preview](https://github.com/wundergraph/wundergraph/actions/workflows/packages-release-preview.yaml)
   to see an preview of the release ([example](https://github.com/wundergraph/wundergraph/actions/runs/2425016891))
   .
2. Trigger the
   workflow [Packages Release](https://github.com/wundergraph/wundergraph/actions/workflows/packages-release.yaml)
   manually in the UI or by running the following command:

```sh
gh workflow list
gh workflow run <workflow> --ref branch-name
```

_\* Requires the github cli and write access to the repository_

### Wunderctl

The release process is triggered locally. The root package version represent the Wunderctl version. We use [GoReleaser](https://goreleaser.com/) to release the wunderctl application
and [release-it](https://github.com/release-it/release-it) only for tagging.

### Wunderctl Wrapper

The NPM package `@wundergraph/wunderctl` is a wrapper for the wunderctl binary. We release it with the wunderctl Go
binary to make the deployment of both applications atomic. **Don't publish** this package with Lerna.
The package is released automatically as soon as the wunderctl binary is published.

### SDK

The [`@wundergraph/sdk`](https://github.com/wundergraph/wundergraph/tree/main/packages/sdk) package is required for all
WunderGraph applications. After installing this package, it will download the compatible `wunderctl` version. This
relationship makes it necessary to release the wunderctl binary first before upgrading
the [`@wundergraph/wunderctl`](https://github.com/wundergraph/wundergraph/tree/main/packages/wunderctl) package.

## How to select the release version?

We use lerna conventional commit integration to estimate the next release version. If you create a PR, we also enforce a proper PR title which decide upon the semver change.

## Release Cheat Sheet

| Component           | Stable Release                                                                                                                                                                                                                                            | Next Release                                    |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| WunderCtl           | [Trigger workflow](https://github.com/wundergraph/wundergraph/actions/workflows/tag-engine-release.yaml) Choose between `patch`, `minor`, `major`.                                                                                                        | Trigger via Workflow run (Select branch `next`) |
| WunderCtl (Wrapper) | Is released automatically after [Wunderctl workflow](https://github.com/wundergraph/wundergraph/actions/workflows/tag-engine-release.yaml) in [Engine Release workflow](https://github.com/wundergraph/wundergraph/actions/workflows/engine-release.yaml) | -                                               |
| NPM Packages        | Trigger via [Workflow](https://github.com/wundergraph/wundergraph/actions/workflows/packages-release.yaml) run (Select `stable`)                                                                                                                          | Trigger via Workflow run (Select branch `next`) |

Next releases must be done on a branch with the name `next`. Regular "stable" releases are done on the `main` branch.
