---
title: Nextjs Todos Tutorials
pageTitle: Nextjs Todos Tutorials
---

## Getting Started

This is how our final app looks like

Start by creating a new project from nextjs postgress template

```typescript
# Init a new project with the nextjs postgress template
npx create-wundergraph-app nextjs-todos -E nextjs-postgres-prisma
```

This will create the app in the `nextjs-todos` directory. Once it finishes, cd into it and run `npm i` to download the WunderGraph SDK.

Navigate to project

```typescript
cd nextjs-todos
```

Install dependencies and start the app

```typescript
npm i && npm start
```

## Setup background color for page

Create a new page in `pages` folder `_document.ts` and paste

```typescript
// pages/_document.ts

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

## Setting up postgress and Todo model

```typescript
// schema.prisma

datasource db {
  provider = "postgresql"
  url      = "postgresql://admin:admin@localhost:54322/example?schema=public"
}

model Todo {
  id        Int     @id @default(autoincrement())
  title     String
  completed Boolean
  order     Int     @default(0)
}
```

The `order` field in Todo decide the `drag and drop` order of todos, we will discuss later in the tutorial how to do drag and drop.

## Starter page screen

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
```

The starter page looks like this
![Wundergraph starter page](https://drive.google.com/file/d/18WDbRfuIKHal6NsCqqfnfo8dwW8npne-/view)

## Add Todos

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

### useAddMutation

```typescript
// hooks/useAddMutation.tsx

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

### Create Todo on Server

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

## Get Todos

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

### Display all

```typescript
// components/TodoList.tsx

import { useQuery } from '../components/generated/nextjs'
import TodoItem from '../components/TodoItem'

const TodoList = () => {
  const { data } = useQuery({
    operationName: 'Todos',
  })
  const todos = data?.todos
  return todos
    ? todos.map((todo) => <TodoItem key={todo.id} todo={todo} />)
    : null
}
export default TodoList
```

## Todo Item

We have a simple design for todo item

```typescript
// components/TodoItem.tsx

import clsx from 'clsx'
import { Fragment, useState } from 'react'

import { Todo } from '../types'

interface TodoItemProps {
  todo: Todo
}

function TodoItem(props: TodoItemProps) {
  console.log(props)
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

## Delete Todo

Deleting todo is simple we need to create

```graphql
# operations/DeleteTodo.graphql
mutation ($id: Int!) {
  db_deleteOneTodo(where: { id: $id }) {
    id
  }
}
```

```typescript
// components/TodoItem.tsx

const deleteTodo = useDeleteTodoMutation()

function deleteTodoItem() {
  deleteTodo.trigger({ id: todo.id }, { throwOnError: false })
}
```

Note below how we filter and remove the element and do optimistic update using SWR

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
When no options were provided you still could override default values by setting WG environment variables
{% /callout %}

## Todo app operations

| Operation             | Action                             | Excuted On |
| --------------------- | ---------------------------------- | ---------- |
| `CreateTodo`          | Create a new todo                  | Server     |
| `Todos`               | Gets all Todos                     | Client     |
| `UpdateTodoOrder`     | Mark todo complete or uncompleted  | Server     |
| `EditTodo`            | Update todo title                  | Client     |
| `UpdateCompleteTodos` | Mark todo completed or uncompleted | Client     |
| `DeleteTodo`          | Delete existing todo               | Client     |
