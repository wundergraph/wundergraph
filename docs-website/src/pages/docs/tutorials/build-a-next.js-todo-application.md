---
title: Build a Next.js Todo application
pageTitle: Build a Next.js Todo application
---

## Getting Started

In this tutorial, we will build a todo app with the following features:

- Create, read, update, and delete todos
  - Mark todos as complete
  - Reorder todos
- Optimistic updates

![Todo application demo](https://ucarecdn.com/b472fc65-1d32-400f-a2df-9d7b78d3e2b9/Todoappshow.gif)

Make sure you have docker installed and up and running. If you don't have the docker setup, check [docker](https://docs.docker.com/get-docker/).

Start by creating a new project using the nextjs postgres template.

```typescript
# Init a new project with the nextjs postgres template
npx create-wundergraph-app nextjs-todos -E nextjs-postgres-prisma
```

This will create the app in the `nextjs-todos` directory once it finishes, cd into it.

```typescript
cd nextjs-todos
```

Install these dependencies and configure tailwindcss.

```typescript
npm install @heroicons/react clsx framer-motion

//For tailwindcss
npm install -D tailwindcss postcss autoprefixer
npm install @tailwindcss/forms
npx tailwindcss init -p
```

Add the paths to all your template files in your tailwind config file.

```js
// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/forms')],
}
```

Add the `@tailwind` directives for each of tailwind’s layers to your globals CSS file.

```css
/* styles/globals.css */

@tailwind base;
@tailwind components;
@tailwind utilities;
```

Import the globals CSS file in the root.

```typescript
// pages/_app.tsx

import { AppProps } from 'next/app'
import Head from 'next/head'
import '../styles/globals.css'

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <Head>
        <title>Todo app</title>
      </Head>
      <main>
        <Component {...pageProps} />
      </main>
    </>
  )
}

export default MyApp
```

Install the dependencies and start.

```typescript
npm install && npm start
```

## Setup app background

```typescript
// pages/_document.tsx

import Document, { Head, Html, Main, NextScript } from 'next/document'

export default class CustomDocument extends Document {
  render() {
    return (
      <Html className="dark">
        <Head>
          <meta charSet="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
        </Head>
        <body className="dark:bg-slate-900">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
```

## Todo model

```typescript
// schema.prisma

model Todo {
  id        Int     @id @default(autoincrement())
  title     String
  completed Boolean
  order     Int     @default(0)
}
```

Run the migrate command and generate code for Todo.

```typescript
 npm run migrate add Todo && wunderctl generate —no-cache
```

The `order` field in Todo decides the reordering of todos. We will discuss later in the tutorial how to do reordering.

## Todo display

```graphql
# .generated/operations/Todos.graphql

query Todos {
  todos: db_findManyTodo(orderBy: { order: asc }) {
    id
    title
    completed
    order
  }
}
```

Verify the Todos query with `curl`.

```shell
 curl http://localhost:9991/operations/Todos
```

Response

```json
{ "data": { "todos": [] } }
```

There are no todos, but we can verify the query is working fine.

Define types for `Todo` and `Todos`.

```typescript
// types/index.d.ts

import { TodoResponseData } from '../components/generated/models'

export type Todo = Required<TodoResponseData>['todo']
export type Todos = Required<TodosResponseData>['todos']
```

Display Todo Items.

```typescript
// components/TodoList.tsx

import { useQuery } from '../components/generated/nextjs'
import { Fragment } from 'react'
import TodoItem from './TodoItem'

const TodoList = () => {
  const { data } = useQuery({
    operationName: 'Todos',
  })
  const todos = data?.todos
  return (
    <Fragment>
      {todos
        ? todos.map((todo) => <TodoItem key={todo.id} todo={todo} />)
        : null}
    </Fragment>
  )
}
export default TodoList
```

Todo Item displays the title here.

```typescript
// components/TodoItem.tsx

import clsx from 'clsx'
import { Fragment, useState } from 'react'

import { Todo } from '../types'

interface TodoItemProps {
  todo: Todo
}

function TodoItem(props: TodoItemProps) {
  const { todo } = props
  const [title, setTitle] = useState<string>(todo.title)
  return (
    <div
      className={clsx(
        'group relative my-2 flex h-11 w-72 items-center justify-between rounded-md py-3 pl-2 pr-1 transition hover:bg-slate-800'
      )}
    >
      <Fragment>
        <div className="mx-1 flex flex-1 items-center">
          <div
            className={clsx(
              'ml-3 flex-1 cursor-pointer text-sm font-medium text-gray-300'
            )}
          >
            <span className="break-all">{title}</span>
          </div>
        </div>
      </Fragment>
    </div>
  )
}

export default TodoItem
```

We will extend and add more code to the `TodoItem` and `TodoList` components in the later part of the tutorial.

{% callout type="warning" %}
`clsx`: is a handy package that makes it easy to write classes.
{% /callout %}

## Add Todo

```graphql
# .wundergraph/operations/CreateTodo.graphql

mutation ($title: String!, $order: Int! @internal) {
  todo: db_createOneTodo(
    data: { title: $title, completed: false, order: $order }
  ) {
    id
  }
}
```

We've used the @internal directive to set the order as an internal variable and remove it from the client.

Create the AddTodo component; the component calls the useAddMutation hook to add a new todo.

```typescript
// components/AddTodo.tsx

import { CheckIcon } from '@heroicons/react/24/solid'
import { useRef, useState } from 'react'

import clsx from 'clsx'
import useAddMutation from '../hooks/useAddTodoMutation'

const AddTodo = () => {
  const createTodo = useAddMutation()

  const [title, setTitle] = useState<string>('')

  const titleRef = useRef<HTMLInputElement>(null)

  function addTodo() {
    if (title.trim().length > 0) {
      createTodo.trigger({ title })
      clearAdd()
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      clearAdd()
    } else if (event.key === 'Enter') {
      addTodo()
    }
  }

  function clearAdd() {
    setTitle('')
  }

  return (
    <div className="relative">
      <input
        ref={titleRef}
        placeholder="Add todo"
        type="text"
        onKeyDown={handleKeyDown}
        value={title}
        onChange={(e) => {
          setTitle(e.target.value)
        }}
        className="h-11 w-72 rounded-md border-slate-600 bg-slate-800 py-2.5 pl-5 pr-10 text-slate-100 placeholder-slate-400 transition focus:border-pink-500 focus:outline-none focus:ring-1  focus:ring-pink-500"
      />
      <button
        onClick={addTodo}
        className={clsx(
          'absolute right-1 top-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded text-white transition hover:bg-gray-700',
          { 'opacity-40': title.trim().length === 0 }
        )}
      >
        <CheckIcon className="h-6 w-6" />
      </button>
    </div>
  )
}

export default AddTodo
```

Let us create the useAddMutation hook, which requests the server to save a Todo.

```typescript
// hooks/useAddTodoMutation.tsx

import { mutate } from 'swr'
import { useMutation, useQuery } from '../components/generated/nextjs'
import { Todos } from '../types'

function useAddMutation() {
  const { data } = useQuery({ operationName: 'Todos' })
  const todos = data?.todos

  const createTodo = useMutation({
    operationName: 'CreateTodo',
  })

  function getNextMaxOrder(todos: Todos) {
    if (!todos || todos.length === 0) {
      return 1
    }
    return todos[todos.length - 1].order + 1
  }

  const trigger: typeof createTodo.trigger = async (input) => {
    const order = getNextMaxOrder(todos)

    if (!input?.title) {
      return
    }

    const newTodos = todos ? [...todos] : []

    newTodos.push({
      id: Math.floor(Math.random() * (13200000 - 95000 + 1) + 95000),
      title: input?.title,
      completed: false,
      order,
    })

    // we optimistically update the cache with the new todo.
    return mutate(
      { operationName: 'Todos' },
      () => {
        return createTodo.trigger(input)
      },
      {
        optimisticData: {
          todos: newTodos,
        },
        populateCache: false,
        revalidate: true,
        rollbackOnError: true,
      }
    )
  }

  return {
    ...createTodo,
    trigger,
  }
}

export default useAddMutation
```

{% callout type="warning" %}
`Custom Hooks:` one common pattern you will see throughout the tutorial is we define custom hooks, e.g., `useAddMutation` for each mutation. This approach works well because it separates the business logic from UI and makes writing and extending code easy.
{% /callout %}

### Optimistic updates

With the optimistic update, the UI updates instantly without waiting for the `mutation` to resolve from the server; in case of failure, revert to the previous UI state with `rollbackOnError = true.`

Use [SWR](https://swr.vercel.app/) for optimistic updates.

- `optimisticData`: Data to immediately update the Todos client cache.
- `populateCache = true`: Should the result of the `CreateTodo` mutation be written to the Todos cache.
- `revalidate = true`: Should the Todos cache revalidate once the `CreateTodo` mutation resolves.
- `rollbackOnError = true`: Should Todo local cache revert to the previous state to ensure the user sees the correct data if the `CreateTodo` mutation fails.

Before creating new todo, on the server, we must assign the order value of the newly created todo to max order + 1; we can do this in the mutatingPreResolve hook for the `CreateTodo` mutation.

Find the max order executing the following query on the server.

```graphql
# .wundergraph/operations/GetLastOrder.graphql

query @internalOperation {
  lastItem: db_findFirstTodo(orderBy: [{ order: desc }]) {
    order
  }
}
```

{% callout type="warning" %}
`GetLastOrder:` finds the todo with max order. The operation is marked @internalOperation Directive, which means it is only accessible from the server.
{% /callout %}

```typescript
// .wundergraph/wundergraph.server.ts

import { configureWunderGraphServer } from '@wundergraph/sdk'
import type { HooksConfig } from './generated/wundergraph.hooks'
import type { InternalClient } from './generated/wundergraph.internal.client'

export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
  hooks: {
    queries: {},
    mutations: {
      CreateTodo: {
        mutatingPreResolve: async ({ input, internalClient }) => {
          const { data } = await internalClient.queries.GetLastOrder()
          let order = 1
          if (data?.lastItem) {
            order = data.lastItem.order + 1
          }
          return {
            ...input,
            order,
          }
        },
      },
    },
  },
}))
```

The `mutatingPreResolve` hook gets called before the `CreateTodo` gets resolved. We set the order to `1` if there are no todos; otherwise, we set it to `max order + 1`

## Display Items

Copy the below WunderGraph svg and paste it into `public/wundergraph.svg`.

```svg
<svg width="660.7" height="649.8" viewBox="0 0 174.81 171.926" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="m131.737 89.532-14.182 24.077-18.124-30.877-18.097 30.824-31.247-53.975C61.305 44.553 79.217 34.87 99.43 34.87a61.728 61.728 0 0 1 32.967 9.499 16.764 16.764 0 0 0-.29 3.069c0 9.101 7.381 16.457 16.456 16.457 9.076 0 16.458-7.382 16.458-16.457 0-9.102-7.382-16.457-16.458-16.457-2.46 0-4.815.555-6.905 1.534-12.118-7.99-26.617-12.673-42.228-12.673-22.886 0-43.391 9.975-57.414 25.823L31.354 27.196a16.33 16.33 0 0 0 2.937-9.366c0-9.102-7.382-16.457-16.457-16.457-9.075 0-16.457 7.382-16.457 16.457 0 9.075 7.382 16.457 16.457 16.457.476 0 .926-.026 1.402-.08L33.047 58.1C26.46 69.397 22.73 82.6 22.73 96.57c0 21.194 8.572 40.376 22.463 54.267 13.89 13.89 33.073 22.463 54.266 22.463 39.952 0 72.866-30.612 76.385-69.718.212-2.328.344-4.63.344-7.011v-7.012h-44.45zm-32.28 68.792c-17.065 0-32.49-6.959-43.655-18.098-11.166-11.165-18.124-26.617-18.124-43.656 0-8.07 1.534-15.796 4.418-22.887l39.106 67.654 18.256-30.876 18.124 30.823 22.172-37.703h20.981c-3.44 30.824-29.554 54.743-61.277 54.743z" style="stroke-width:.264583" transform="translate(-1.377 -1.373)"/></svg>
```

Now let us define the index page.

```typescript
// pages/index.tsx

import { NextPage } from 'next'
import { Fragment } from 'react'
import AddTodo from '../components/AddTodo'
import { withWunderGraph } from '../components/generated/nextjs'

import TodoList from '../components/TodoList'

const Home: NextPage = () => {
  return (
    <Fragment>
      <div className="align-center flex w-full flex-col items-center">
        <div className="mt-[10%]">
          <div className="mb-10 w-72">
            <div className="flex items-center justify-center">
              <a href="https://wundergraph.com" target="_blank">
                <img
                  src="/wundergraph.svg"
                  className="h-8"
                  alt="WunderGraph logo"
                />
              </a>
              <span className="ml-3 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-3xl font-semibold text-transparent">
                WunderTodo
              </span>
            </div>
          </div>
          <AddTodo />
          <div className="mt-4">
            <TodoList />
          </div>
        </div>
      </div>
    </Fragment>
  )
}

export default withWunderGraph(Home)
```

![Display and add Todo](https://ucarecdn.com/830183b0-cbb1-4648-9bee-c91737d4532d/Todoappaddtodopageresize.png)

## Delete Todo

Delete a todo with a todo id.

```graphql
# .wundergraph/operations/DeleteTodo.graphql

mutation ($id: Int!) {
  db_deleteOneTodo(where: { id: $id }) {
    id
  }
}
```

Invoke the useDeleteTodoMutation hook from TodoItem.

```typescript
// components/TodoItem.tsx

const deleteTodo = useDeleteTodoMutation()

function deleteTodoItem() {
  deleteTodo.trigger({ id: todo.id }, { throwOnError: false })
}
```

Repeating the `Custom Hooks` pattern, define the useDeleteTodoMutation custom hook that deletes a todo with a given id.

```typescript
// hooks/useDeleteTodoMutation.tsx

import { useSWRConfig } from 'swr'
import { useMutation, useQuery } from '../components/generated/nextjs'

function useDeleteTodoMutation() {
  const { mutate } = useSWRConfig()
  const { data } = useQuery({ operationName: 'Todos' })
  const deleteTodo = useMutation({ operationName: 'DeleteTodo' })

  const trigger: typeof deleteTodo.trigger = async (input, options) => {
    const filteredTodos = data?.todos.filter((t) => t.id !== input?.id) || []

    return await mutate(
      {
        operationName: 'Todos',
      },
      () => {
        return deleteTodo.trigger(input, options)
      },
      {
        optimisticData: {
          todos: filteredTodos,
        },
        populateCache: false,
        revalidate: true,
        rollbackOnError: true,
      }
    )
  }

  return {
    ...deleteTodo,
    trigger,
  }
}

export default useDeleteTodoMutation
```

{% callout type="warning" %}
Observe how we optimistically update the data by filtering the deleted item.
{% /callout %}

## Update Todo

### Complete Todo

Mark the todo complete or incomplete for a given todo id.

```graphql
# .wundergraph/operations/UpdateCompleteTodo.graphql

mutation ($id: Int!, $complete: Boolean!) {
  db_updateOneTodo(
    where: { id: $id }
    data: { completed: { set: $complete } }
  ) {
    id
  }
}
```

Define updateCompletedStatus, which is a called on a checkbox event; this invokes a useUpdateCompleteStatusMutation custom hook to update status.

```typescript
// components/TodoItem.tsx

const updateCompleteTodo = useUpdateCompleteStatusMutation()
const [completed, setCompleted] = useState<boolean>(todo.completed)

function updateCompletedStatus(e: React.ChangeEvent<HTMLInputElement>) {
  const newCheckedStatus = e.target.checked
  setCompleted(newCheckedStatus)
  updateCompleteTodo.trigger(
    { id: todo.id, complete: newCheckedStatus },
    { throwOnError: false }
  )
}
```

Define a useUpdateCompleteStatusMutation hook to change the complete status on the server.

```typescript
// hooks/useUpdateCompleteStatusMutation.tsx

import { useSWRConfig } from 'swr'
import { useMutation, useQuery } from '../components/generated/nextjs'

function useUpdateCompleteStatusMutation() {
  const { mutate } = useSWRConfig()
  const { data } = useQuery({ operationName: 'Todos' })
  const todos = data?.todos
  const updateCompleteTodo = useMutation({
    operationName: 'UpdateCompleteTodo',
  })

  const trigger: typeof updateCompleteTodo.trigger = async (input, options) => {
    if (!todos || !input) {
      return updateCompleteTodo.trigger(input, options)
    }
    const updatedTodos = [...todos]
    const item = updatedTodos.find((t) => t.id === input?.id)

    if (item) {
      item.completed = input.complete
    }

    mutate(
      {
        operationName: 'Todos',
      },
      () => {
        return updateCompleteTodo.trigger(input, options)
      },
      {
        optimisticData: {
          todos: updatedTodos,
        },
        populateCache: false,
        revalidate: true,
        rollbackOnError: true,
        ...options,
      }
    )
  }

  return {
    ...updateCompleteTodo,
    trigger,
  }
}

export default useUpdateCompleteStatusMutation
```

### Edit Title

Update the todo title for a given todo id.

```graphql
# .wundergraph/operations/EditTodo.graphql

mutation ($id: Int, $title: String!) {
  db_updateOneTodo(where: { id: $id }, data: { title: { set: $title } }) {
    id
  }
}
```

The editTodoTile clears the edit mode and invokes the useUpdateTitleMutation custom hook to edit the title.

```typescript
// components/TodoItem.tsx
const editTodoTitle = useUpdateTitleMutation()
const [title, setTitle] = useState<string>(todo.title)
const [editMode, setEditMode] = useState<boolean>(false)

function editTodoTile() {
  if (title.trim().length > 0) {
    clearEdit()
    editTodoTitle.trigger({ id: todo.id, title }, { throwOnError: false })
  }
}
function clearEdit() {
  setEditMode(false)
}
```

Define a useUpdateTitleMutation hook to update the title for a given todo id on the server.

```typescript
//hooks/useUpdateTitleMutation.ts

import { useSWRConfig } from 'swr'
import { useMutation, useQuery } from '../components/generated/nextjs'

function useUpdateTitleMutation() {
  const { mutate } = useSWRConfig()
  const { data } = useQuery({ operationName: 'Todos' })
  const todos = data?.todos

  const updateTodo = useMutation({ operationName: 'EditTodo' })

  const trigger: typeof updateTodo.trigger = async (input, options) => {
    if (!todos || !input) {
      return updateTodo.trigger(input, options)
    }
    const updatedTodos = [...todos]
    const item = updatedTodos.find((t) => t.id === input?.id)

    if (item) {
      item.title = input.title
    }

    await mutate(
      {
        operationName: 'Todos',
      },
      async () => {
        return updateTodo.trigger(input, options)
      },
      {
        optimisticData: {
          todos: updatedTodos,
        },
        populateCache: false,
        revalidate: true,
        rollbackOnError: true,
        ...options,
      }
    )
  }

  return {
    ...updateTodo,
    trigger,
  }
}

export default useUpdateTitleMutation
```

{% callout type="warning" %}
Observe how we optimistically update `Complete Todo` and `Edit Todo`.
{% /callout %}

## Reorder Todos

Let us discuss the most exciting part of the app: how do we do todos `reordering`?

- Use the `order` property of todos; the first inserted item has order `1` and subsequently inserted todos have `max order + 1`.
- Upon reordering items, send the `id` of the `dragged` item together with `newOrder` to the server and run.
  - Use item `id` to find the `oldOrder` using `GetLastOrder`.
    - If the `newOrder` is less than the `oldOrder`, increase the order value of all items that are >= newOrder and < oldOrder.
    - Else, If the newOrder is greater than the oldOrder, decrease the order value of all items that are <= newOrder and > oldOrder.
  - Update the item order to newOrder.

Increment all todo order where todo order >= newOrder && order < oldOrder.

```graphql
# .wundergraph/operations/ReorderTodosDragDown.graphql

mutation ($newOrder: Int, $oldOrder: Int) @internalOperation {
  db_updateManyTodo(
    where: { order: { gte: $newOrder, lt: $oldOrder } }
    data: { order: { increment: 1 } }
  ) {
    count
  }
}
```

Decrement all todo order where order > oldOrder && order <= newOrder.

```graphql
# .wundergraph/operations/ReorderTodosDragUp.graphql

mutation ($newOrder: Int, $oldOrder: Int) @internalOperation {
  db_updateManyTodo(
    where: { order: { gt: $oldOrder, lte: $newOrder } }
    data: { order: { decrement: 1 } }
  ) {
    count
  }
}
```

At last, run UpdateTodoOrder and update the dragged item with a new order.

```graphql
# .wundergraph/operations/UpdateTodoOrder.graphql

mutation ($id: Int!, $order: Int!) {
  todo: db_updateOneTodo(where: { id: $id }, data: { order: { set: $order } }) {
    id
    order
  }
}
```

Find the current order of a todo with a given id; this query is needed for the preResolve hook for UpdateTodoOrder, as discussed below.

```graphql
# .wundergraph/operations/Todo.graphql

query Todo($id: Int!) {
  todo: db_findFirstTodo(where: { id: { equals: $id } }) {
    id
    title
    completed
    order
  }
}
```

Now let us define a preResolve hook for UpdateTodoOrder this hook updates all the items that moved up or down. The UpdateTodoOrder gets executed at last, which updates the order of the dragged item with the new order.

```typescript

// ./wundergraph/wundergraph.server.ts

import {configureWunderGraphServer} from "@wundergraph/sdk";
import type {HooksConfig} from "./generated/wundergraph.hooks";
import type {InternalClient} from "./generated/wundergraph.internal.client";

export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
    hooks: {
        queries: {},
        mutations: {
            CreateTodo:{...},
            UpdateTodoOrder: {
                preResolve: async ({input, internalClient}) => {
                    const {data} = await internalClient.queries.Todo({
                        input: {id: input.id}
                    });

                    if (!data?.todo) {
                        return;
                    }

                    if (data.todo.order > input.order) {
                        await internalClient.mutations.ReorderTodosDragDown({
                            input: {
                                newOrder: input.order,
                                oldOrder: data.todo.order
                            }
                        });
                    } else if (data.todo.order <= input.order) {
                        await internalClient.mutations.ReorderTodosDragUp({
                            input: {
                                newOrder: input.order,
                                oldOrder: data.todo.order
                            }
                        });
                    }
                }
            }
        }
    }
}));
```

The preResolve increment/decrement by one the order of all items that moved except the dragged item. At last, with the `UpdateTodoOrder` dragged item gets updated with a new order.

Define a useReorderTodoMutation custom hook that will call UpdateTodoOrder.

```typescript
// hooks/useReorderTodoMutation.tsx

import { useSWRConfig } from 'swr'
import { useMutation } from '../components/generated/nextjs'

function useReorderTodoMutation() {
  const { mutate } = useSWRConfig()
  const mutation = useMutation({
    operationName: 'UpdateTodoOrder',
    onSuccess() {
      mutate({ operationName: 'Todos' })
    },
    onError() {
      mutate({ operationName: 'Todos' })
    },
  })
  return mutation
}

export default useReorderTodoMutation
```

Next, update the TodoList component to support reordering, and `onDragEnd` invoke useReorderTodoMutation to update reordering on the server.

```typescript
//components/TodoList.tsx

import { Reorder } from 'framer-motion'
import { useState } from 'react'
import { useSWRConfig } from 'swr'

import { useQuery } from '../components/generated/nextjs'
import TodoItem from '../components/TodoItem'

import useReorderTodoMutation from '../hooks/useReorderTodoMutation'
import { Todo, Todos } from '../types'

const TodoList = () => {
  const { mutate } = useSWRConfig()
  const { data } = useQuery({
    operationName: 'Todos',
  })
  const todos = data?.todos
  const [previousTodos, setPreviousTodos] = useState<Todo[] | undefined>(
    undefined
  )
  const reorderTodo = useReorderTodoMutation()

  function handleReorder(newOrder: Todos) {
    mutate(
      { operationName: 'Todos' },
      { todos: newOrder },
      { revalidate: false }
    )
  }

  async function reorderItems(item: Todo, index: number) {
    if (previousTodos) {
      const newOrder = previousTodos[index].order
      const oldOrder = item.order
      if (newOrder && newOrder !== oldOrder) {
        reorderTodo.trigger(
          { id: item.id, order: newOrder },
          { throwOnError: false }
        )
      }
    }
  }

  return todos ? (
    <Reorder.Group axis="y" values={todos} onReorder={handleReorder}>
      {todos.map((todo, index: number) => (
        <Reorder.Item
          onDragStart={() => {
            setPreviousTodos(JSON.parse(JSON.stringify(todos)))
          }}
          onDragEnd={() => {
            reorderItems(todo, index)
          }}
          key={todo.id}
          value={todo}
        >
          <TodoItem todo={todo} />
        </Reorder.Item>
      ))}
    </Reorder.Group>
  ) : null
}

export default TodoList
```

Let us break down what is happening here

- The `previousTodos` contains todos before the start of the drag; when the drag ends, the new order gets updated in `todos`.
- `handleReorder` gets executed on the swap of each item; this updates the `Todos` cache.
- `onDragEnd,` we make the server call to update the order.
  - Use `previousTodos` to find the `newOrder` of the dragged item. `newOrder = previousTodos[index].order.`
  - Invoke the `useReorderTodoMutation` hook passing item `id` and `newOrder` to make an update on the server.

## Put it all together

Now we can update TodoItem with all features.

```typescript
// components/TodoItem.tsx

import clsx from 'clsx'
import React, { Fragment, useEffect, useRef, useState } from 'react'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid'

import useDeleteTodoMutation from '../hooks/useDeleteTodoMutation'
import useUpdateCompleteStatusMutation from '../hooks/useUpdateCompleteStatusMutation'
import useUpdateTitleMutation from '../hooks/useUpdateTitleMutation'
import { Todo } from '../types'

interface TodoItemProps {
  todo: Todo
}

function TodoItem(props: TodoItemProps) {
  const { todo } = props
  const editTodoTitle = useUpdateTitleMutation()
  const updateCompleteTodo = useUpdateCompleteStatusMutation()
  const deleteTodo = useDeleteTodoMutation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState<string>(todo.title)
  const [completed, setCompleted] = useState<boolean>(todo.completed)
  const [editMode, setEditMode] = useState<boolean>(false)

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement
      if (!inputRef.current || inputRef.current.contains(target)) {
        return
      }
      setEditMode(false)
    }
    if (editMode) {
      document.addEventListener('mousedown', listener)
      document.addEventListener('touchstart', listener)
    }
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [editMode])

  function updateCompletedStatus(e: React.ChangeEvent<HTMLInputElement>) {
    const newCheckedStatus = e.target.checked
    setCompleted(newCheckedStatus)
    updateCompleteTodo.trigger(
      { id: todo.id, complete: newCheckedStatus },
      { throwOnError: false }
    )
  }

  function deleteTodoItem() {
    deleteTodo.trigger({ id: todo.id }, { throwOnError: false })
  }

  function editTodoTile() {
    if (title.trim().length > 0) {
      clearEdit()
      editTodoTitle.trigger({ id: todo.id, title }, { throwOnError: false })
    }
  }

  function clearEdit() {
    setEditMode(false)
  }

  function resetTitle() {
    setTitle(todo.title)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      clearEdit()
      resetTitle()
    } else if (event.key === 'Enter') {
      editTodoTile()
    }
  }

  function enableEditMode() {
    setEditMode(true)
    setTimeout(() => {
      inputRef.current?.focus()
    })
  }

  return (
    <div
      className={clsx(
        'group relative my-2 flex h-11 w-72 items-center justify-between rounded-md py-3 pl-2 pr-1 transition hover:bg-slate-800',
        editMode && 'bg-slate-800'
      )}
    >
      {!editMode ? (
        <Fragment>
          <div className="mx-1 flex flex-1 items-center">
            <input
              onChange={updateCompletedStatus}
              type="checkbox"
              checked={completed}
              className="h-4 w-4 cursor-pointer rounded-full border-gray-500 bg-slate-800 text-pink-600 accent-pink-500 ring-pink-500 transition hover:border-pink-500 hover:ring-1 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:ring-offset-0"
            />
            <div
              onDoubleClick={enableEditMode}
              className={clsx(
                'ml-3 flex-1 cursor-pointer text-sm font-medium text-gray-300',
                [completed && 'line-through']
              )}
            >
              <span className="break-all">{title}</span>
            </div>
          </div>
          <div
            onClick={deleteTodoItem}
            className="ml-5 hidden h-9 w-9  cursor-pointer flex-col items-center justify-center rounded text-white opacity-50 transition hover:bg-gray-700 hover:opacity-100 group-hover:flex"
          >
            <XMarkIcon className="h-6 w-6" />
          </div>
        </Fragment>
      ) : (
        <Fragment>
          <div className="relative w-full">
            <input
              ref={inputRef}
              type="text"
              onKeyDown={handleKeyDown}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={clsx(
                'leadig-0 -mt-[1px] h-11 w-full rounded border-0 bg-slate-800 py-2.5 pl-8 pr-2 text-sm font-medium text-white focus:border-0 focus:outline-none focus:ring-0'
              )}
            />
            <button
              onClick={editTodoTile}
              className={clsx(
                'absolute right-0 top-1 -mt-[1px] flex h-9 w-9 cursor-pointer items-center justify-center rounded text-white transition hover:bg-gray-700',
                { 'opacity-40': title.trim().length === 0 }
              )}
            >
              <CheckIcon className="h-6 w-6" />
            </button>
          </div>
        </Fragment>
      )}
    </div>
  )
}

export default TodoItem
```

Let us break down TodoItem actions.

- `useEffect`: Is responsible for closing the edit mode on mouse click or touch outside the edit input.
- `updateCompletedStatus`: Calls the useUpdateCompleteStatusMutation hook to update the completed status of the todo.
- `deleteTodoItem`: Invokes the useDeleteTodoMutation hook to delete the current todo.
- `editTodoTile`: Calls the useUpdateTitleMutation hook to update the title of the todo.
- `clearEdit`: Sets edit mode to false.
- `resetTitle`: Resets the title to original default value.
- `handleKeyDown`: Handles `enter` and `escape` keys, on enter updates the todo title, on escape calls clearEdit and resetTitle.
- `enableEditMode`: Sets edit mode to true and, focues on the edit input.
  ![Todo application demo](https://ucarecdn.com/b472fc65-1d32-400f-a2df-9d7b78d3e2b9/Todoappshow.gif)

## Wrap up

Congratulations! you have just built a todo app from scratch! Check the code [Todo App Code](https://github.com/wundergraph/wundergraph/tree/main/examples/nextjs-todos) to run it locally and try to experiment with it and see how it works.
