# Contributing to the WunderGraph Repository

Welcome to the WunderGraph Community contributing guide. We are excited to having you!

## Prerequisites

This guide assumes you have already installed the following software:

- make (should be installed on all linux / IOS systems)
- golang `>= 1.18`
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

### Run the tests

This command will run all Go and NPM tests.

```bash
make test
```

Ready! You can now start contributing to the WunderGraph repository. Feel free to open an issue or pull request to add a new feature or fix a bug.
If you run into any onboarding issue, please open an issue as well or visit the [WunderGraph Discord](https://discord.gg/Jjmc8TC) to get help. 
