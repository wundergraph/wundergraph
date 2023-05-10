# Examples

This directory contains examples of WunderGraph applications that be used
to demostrate features or as templates for new applications.

## Conventions

Each example should be self-contained and depend on the latest version of the SDK.
This is updated after each release. During CI, we also test examples against the
libraries in the main branch.

Each example must contain a `README.md` file explaining what the example does, as well as
instructions for setting it up and running.

Examples are expected to include the following node scripts:

    1. `postinstall` (optional, Development & CI): prepare the start e.g. by copying .env.example to .env.test
    2. `start`: (required, development) starts the example with a single command
    3. `start:services` (optional, Development & CI): start any local services (docker, additonal server) required by the example
    4. `wait-on:services` (optional, Development & CI): wait for the services to be ready
    5. `build` (required): generates the WunderGraph build
    6. `setup` (optional, Development & CI): setup the example (e.g. migration) after the environment is ready
    7. `test` (optional, Development & CI): runs the tests for the example
    8. `cleanup` (optional, Development & CI): stops,remove all provisioned resources e.g. shutdown docker containers or kill processes

If the example uses containers, it should have a `docker-compose.yml` file at the top. `package.json` should
include a `start:services` script that runs `docker-compose up -d` and a `cleanup` script that runs `docker-compose down -v`.

For packages with tests, there should be a `test` script that runs the test suite.

If the example requires environment variables to be set, provide an `.env.example` file as well as
instructions (e.g. where to create an account). The script `postinstall` should copy `.env.example` to `.env`. The `.env` file should be ignored by git.

## Package manager

All examples should use `npm` as the package manager.
