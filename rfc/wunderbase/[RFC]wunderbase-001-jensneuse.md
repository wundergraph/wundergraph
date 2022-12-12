# RFC WunderBase

## Problem

We'd like to offer an easy-to-use, zero touch, persistence layer that integrates well with functions.
The solution should work both locally and in the cloud without complex configuration.

## Solution

We build a tight integration between WunderBase, WunderGraph SDK & WunderGraph Cloud.

### Configuration

In the directory `.wundergraph`,
we'll introduce a new subdirectory called "wunderbase".

If you'd like to create a new WunderBase, you'll have to follow conventions below:

To create a new WunderBase,
add a new subdirectory to wunderbase, e.g. `.wundergraph/wunderbase/app` and add a config file (`index.ts`) and a schema file `schema.prisma`.

The file tree will look like this:

```
.wundergraph
└── wunderbase
    └── app
        ├── index.ts
        └── schema.prisma
```

The config file will look like this:

```ts
import { configureWunderBase } from '@wundergraph/sdk';

export default configureWunderBase({
  // apiNamespace is the namespace for the generated API
  apiNamespace: 'app',
});
```

The schema file will look like this:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  name  String
}
```

## Workflow for local development

When running `wunderctl up`,
we'll check if there's a valid configuration for a WunderBase instance in the `.wundergraph/wunderbase` directory.

If a valid config is detected,
we will run a migration and introspect the schema.
The generated schema will then be added to the virtual graph using the configured `apiNamespace`.

The WunderBase is now usable.
If you'd like to make changes to the schema,
you can edit the `schema.prisma` file and run `wunderctl up` again.

## Workflow for WunderGraph Cloud

When deploying to WunderGraph Cloud,
we'll check if there's a valid configuration for a WunderBase instance in the `.wundergraph/wunderbase` directory.

If a valid config is detected,
we'll create a WunderBase instance in the cloud.
If the `schema.prisma` file contains the provider `sqlite`,
we'll attach a volume to the WunderBase instance,
otherwise we'll create it to be ephemeral.

The instance will be named "app-{branch}", e.g. "app-main".
Changing the name of the directory will create a new instance.

This naming pattern would allow us to have one dedicated instance per branch if required.

## Deployment details

As we're deploying a machine with the WunderBase image,
we have to indicate that this database datasource should point to a deployed instance of WunderBase.
This is indicated extending the protobuf definition of the datasource:

```protobuf
message DataSourceCustom_Database {
	ConfigurationVariable databaseURL = 1;
	string prismaSchema = 2;
	string graphqlSchema = 3;
	// closeTimeoutSeconds define that the database connection will be closed after the given amount of seconds of inactivity
	int64 closeTimeoutSeconds = 4;
	repeated SingleTypeField jsonTypeFields = 5;
	repeated string jsonInputVariables = 6;
  bool isWunderBase = 7;
  string wunderBaseURL = 8;
}
```

The `isWunderBase` flag indicates that this datasource is a WunderBase instance.
In this case, `wunderctl start` will not start an instance of Prisma,
but instead will make requests to the deployed WunderBase instance.

When we run the build step (`wunderctl generate`),
we have to detect if there's a WunderBase instance in the `.wundergraph/wunderbase` directory.
If there's a WunderBase instance,
We'll have to build the WunderBase image and make sure it's deployed as well.

Additionally, we have to keep track of existing WunderBase instances.
If a WunderBase instance is removed from the `.wundergraph/wunderbase` directory,
we'll have to remove the instance from the cloud as well.
