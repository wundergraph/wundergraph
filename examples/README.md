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

    - `start:services` (optional): start any local services required by the example (no containers)
    - `start`: starts all the services as well containers and runs wunderctl up --debug

If the example uses containers, it should have a `docker-compose.yml` file at the top. `package.json` should
include a `start:container` script that runs `docker-compose up -d`.

For packages with tests, there should be a `test` script that runs the test suite.

If the example requires environment variables to be set, provide an `example.env` file as well as
instructions (e.g. where to create an account).
