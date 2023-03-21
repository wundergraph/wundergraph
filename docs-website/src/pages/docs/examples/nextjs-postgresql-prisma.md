---
title: NextJS PostgreSQL Prisma Example
pageTitle: WunderGraph - Examples - NextJS PostgreSQL Prisma
description:
---

This example demonstrates how to use NextJS, PostgreSQL and Prisma in WunderGraph.

## Getting started

Scaffold the project:

```bash
npx create-wundergraph-app my-project -E nextjs-postgres-prisma
```

Then from the project root,
install the dependencies and start the development server:

```bash
cd my-project
npm install
npm run start
```

## The Prisma Schema

We use Prisma to migrate the database.
Find below the schema we're using:

```prisma
datasource db {
  provider = "postgresql"
  url      = "postgresql://admin:admin@localhost:54322/example?schema=public"
}

model Post {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  title     String   @db.VarChar(255)
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
}

model Profile {
  id     Int     @id @default(autoincrement())
  bio    String?
  user   User    @relation(fields: [userId], references: [id])
  userId Int     @unique
}

model User {
  id      Int      @id @default(autoincrement())
  email   String   @unique
  name    String?
  posts   Post[]
  profile Profile?
}
```

## Seeding the Database

We're using WunderGraph to seed the database:

```typescript
import { createClient } from '../.wundergraph/generated/client';
import fetch from 'node-fetch';

const seed = async () => {
  const client = createClient({
    customFetch: fetch as any,
  });
  const user = await client.query({
    operationName: 'UserByEmail',
    input: {
      email: 'jens@wundergraph.com',
    },
  });
  if (user?.data?.db_findFirstUser) {
    return;
  }
  const out = await client.mutate({
    operationName: 'CreateUser',
    input: {
      name: 'Jens',
      bio: 'Founder@WunderGraph',
      email: 'jens@wundergraph.com',
      title: 'Welcome to WunderGraph!',
      content: 'This is WunderGraph =)',
      published: true,
    },
  });
  console.log('seed:out', JSON.stringify(out));
};

seed();
```

## Learn more

- [@wundergraph/react-query reference](/docs/clients-reference/react-query)
- [React Query documentation](https://tanstack.com/query/v4/docs/overview)
- [Next.js client documentation](/docs/clients-reference/nextjs)

## Deploy to WunderGraph Cloud

The easiest way to deploy your WunderGraph app is to use [WunderGraph Cloud](https://cloud.wundergraph.com). Enable the [Vercel integration](https://vercel.com/integrations/wundergraph) to deploy the Next.js frontend to Vercel.

{% deploy template="nextjs-postgresql-prisma" /%}
