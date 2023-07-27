# Contributing to the WunderGraph Repository

Welcome to the WunderGraph Community contributing guide. We are excited to have you!

## Prerequisites

This guide assumes you have already installed the following software:

- make (should be installed on all linux / IOS systems)
- [protoc](https://grpc.io/docs/protoc-installation/) (3.15.8)
  - curl -LO "https://github.com/protocolbuffers/protobuf/releases/download/v21.5/protoc-21.5-linux-x86_64.zip"
- golang `>= 1.20`
- Node.js [LTS](https://nodejs.org/en/about/releases/)
- pnpm `7`

## Getting Started

The WunderGraph Repository is managed as a monorepo. We host three main components:

- WunderGraph SDK
- WunderCtl (The primary CLI)
- WunderCtl (The CLI wrapper, distributed as a NPM package)

Those components can be summarized in two categories:

1. NPM Packages
2. Go Modules

All npm packages are stored under [`./packages`](./packages) and managed as a [pnpm workspace](https://pnpm.io/workspaces). This means during development all dependencies are linked.
The root [`package.json`](package.json) provides all scripts you need to orchestrate the development and release workflow.

The primary structure of the repository is inherited from the [Standard Go Project Layout](https://github.com/golang-standards/project-layout). For common tasks in the monorepo we use a `makefile`.

### Bootstrap the development environment

This command will install the necessary dependencies for the WunderGraph repository and build all libraries.

```bash
make
```

### Use your local wunderctl binary if you test SDK changes

Before you run any testapp, you need to ensure that you use your local wunderctl binary. This is necessary because the examples are using the downloaded wunderctl binary from GithHub.

```bash
# Ensure your GOBIN is on your path.  Only needs doing once
PATH=$PATH:$(go env GOPATH)/bin
# Install the wunderctl binary in your GOBIN.
make install
# Set this environment variable to use your local wunderctl binary for all calls in the SDK.
WUNDERCTL_BINARY_PATH="$(which wunderctl)"
```

### Run the tests

This command will run all Go and NPM tests.

```bash
make test
```

In order to run integration tests add the `INT=true` environment variable.

Ready! You can now start contributing to the WunderGraph repository. Feel free to open an issue or pull request to add a new feature or fix a bug.
If you run into any onboarding issue, please open an issue as well or visit the [WunderGraph Discord](https://discord.gg/Jjmc8TC) to get help.

## Conventional Commit Standard

We use [conventionalcommits](https://www.conventionalcommits.org/en/v1.0.0-beta.2/#why-use-conventional-commits) for changelog generation and more structured commit messages.

In order to enforce this standard, we use a linter on pre-commit hook. This functionality is provided by [husky](https://typicode.github.io/husky/#/). If you use a Node version manager like `nvm` you need tell husky where to find `pnpm`.
Here is a snippet for `nvm`:

```bash
echo "export NVM_DIR="$HOME/.nvm"\n[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm" > ~/.huskyrc
```

### For JetBrains users

[This](https://plugins.jetbrains.com/plugin/13389-conventional-commit) plugin simplifies the commit message creation process.

### Pull Requests

We merge all pull requests in `squash merge` mode. You're not enforced to use [conventional commit standard](https://www.conventionalcommits.org/en/v1.0.0-beta.2/#why-use-conventional-commits) across all your commits, but it's good practice and avoids mistakes. However, it's important that the ultimate squashed commit message follow the conventionalcommit standard.

## Releases

See the [Release Guide](docs/releasing.md) for more information.
