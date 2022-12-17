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

    - `start:services` (optional, Development & CI): start any local services required by the example (no containers)
    - `wait-on:services` (optional, Development & CI): wait for the services to be ready
    - `setup` (optional, CI): setup the example for testing
    - `start`: (development) starts all the services as well containers and runs wunderctl up --debug
    - `prestart` (development, optional): e.g. copying .env.example to .env
    - `cleanup` (optional, Development & CI): stops or remove all provisioned resources

If the example uses containers, it should have a `docker-compose.yml` file at the top. `package.json` should
include a `start:container` script that runs `docker-compose up -d`.

For packages with tests, there should be a `test` script that runs the test suite.

If the example requires environment variables to be set, provide an `.env.example` file as well as
instructions (e.g. where to create an account). The script `prestart` should copy `.env.example` to `.env`. The `.env` file should be ignored by git.
