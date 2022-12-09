# TypeScript ORM

## Problem

The trpc developer experience is great,
but it's lacking features from GraphQL and Relay to make data fetching a truly great DX.

Additionally, we'd like to have a TypeScript ORM on top of the "virtual Graph" to be used server-side to implement functions.

Combined, we're looking to build a TypeScript ORM that's generated on top of the virtual Graph,
allowing the user to easily compose strictly typed Operations,
while being able to compose them using Fragments, similar to Relay and GraphQL.

## Motivation

I truly believe that defining data dependencies at the component level is the best experience we can offer to developers.
With tools like trpc, you're defining "procedures" everywhere in your codebase,
making it really hard to manage and scale your data dependencies.

This will lead to a lot of duplicate code, waterfalls of small rpc requests,
and makes it really hard to figure out what data exactly is needed per component.
Finally, with the trpc approach you have to pass data from "stateful" components,
those that fetch the data, to components that are only responsible for rendering.

That said, trpc offers a superior developer experience as there's not compile step required and all procedures are statically typed between backend and frontend.
This RPC tries to find some middle ground between trpc and GraphQL.

It should be possible to remove GraphQL entirely from the frontend-layer.
Defining Queries and Fragments could be done purely in TypeScript,
allowing for the same snappy DX as trpc,
while allowing us to define data dependencies at the component level,
and composing these re-usable dependencies into root level queries.

Combining the ideas from both approaches could give us the DX of tRPC,
with the scalability of GraphQL & Relay,
while massively simplifying the usage of the ideas behind Relay.

## Illustration of the concept

Here's an early draft to illustrate the idea.
At the root of the page, we're able to define a Query.
Each Component can export one or more Fragments.
Fragments are being imported by the root page and then used to compose the "Page Query".

```tsx
// src/pages/index.tsx
import { useQuery } from '../../.wundergraph/generated/client';
import { Avatar_user } from '../components/Avatar';
import { UnreadMessages_unreadMessages } from '../components/UnreadMessages';
import { Notifications_notifications } from '../components/Notifications';
import { NewsFeedList_feed } from '../components/NewsFeedList';
export function NewsFeed() {
  const feed = useQuery({
    operationName: 'NewsFeed',
    query: (q) => ({
      user: q.user({
        ...Avatar_user.fragment,
      }),
      unreadMessages: q.unreadMessages({
        ...UnreadMessages_unreadMessages.fragment,
      }),
      notifications: q.notifications({
        ...Notifications_notifications.fragment,
      }),
      ...NewsFeedList_feed.fragment,
    }),
  });
  return (
    <div>
      <Avatar />
      <UnreadMessages />
      <Notifications />
      <NewsFeedList />
    </div>
  );
}

// src/components/Avatar.tsx
import { useFragment, Fragment } from '../../.wundergraph/generated/client';
export const Avatar_user = Fragment({
  on: 'User',
  fragment: ({ name, avatar }) => ({
    name,
    avatar,
  }),
});
export function Avatar() {
  const data = useFragment(Avatar_user);
  return (
    <div>
      <h1>{data.name}</h1>
      <img src={data.avatar} />
    </div>
  );
}

// src/components/NewsFeedList.tsx
import { useFragment, Fragment } from '../../.wundergraph/generated/client';
import { NewsFeedItem_item } from './NewsFeedItem';
export const NewsFeedList_feed = Fragment({
  on: 'NewsFeed',
  fragment: ({ items }) => ({
    items: items({
      ...NewsFeedItem_item.fragment,
    }),
  }),
});
export function NewsFeedList() {
  const data = useFragment(NewsFeedList_feed);
  return (
    <div>
      {data.items.map((item) => (
        <NewsFeedItem item={item} />
      ))}
    </div>
  );
}

// src/components/NewsFeedItem.tsx
import { useFragment, Fragment } from '../../.wundergraph/generated/client';
export const NewsFeedItem_item = Fragment({
  on: 'NewsFeedItem',
  fragment: ({ id, author, content }) => ({
    id,
    author,
    content,
  }),
});
export function NewsFeedItem() {
  const data = useFragment(NewsFeedItem_item);
  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.content}</p>
    </div>
  );
}
```
