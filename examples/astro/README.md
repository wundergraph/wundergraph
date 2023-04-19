# WunderGraph + Astro

This examples shows how to use WunderGraph with [Astro](https://astro.build).

```
npx create-wundergraph-app --example=astro
```

## 🚀 Project Structure

Inside of your project, you'll see the following folders and files:

```
/
├── .wundergraph/
│   ├── wundergraph.config.ts
|   ├── wundergraph.operations.ts
|   ├── wundergraph.server.ts
│   └── operations/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── Card.astro
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

WunderGraph operations are placed in the `.wundergraph/operations/` directory. Each file becomes an Operation. Operations can be written in GraphQL or TypeScript.

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                              |
| :--------------------- | :-------------------------------------------------- |
| `npm install`          | Installs dependencies                               |
| `npm start`            | Starts the WunderGraph and Astro dev servers        |
| `npm run wundergraph`  | Starts local WunderGraph server at `localhost:9991` |
| `npm run dev`          | Starts local dev server at `localhost:3000`         |
| `npm run build`        | Build your production site to `./dist/`             |
| `npm run preview`      | Preview your build locally, before deploying        |
| `npm run astro ...`    | Run CLI commands like `astro add`, `astro check`    |
| `npm run astro --help` | Get help using the Astro CLI                        |

## Learn More

- [WunderGraph Docs](https://wundergraph.com/docs)
- [Astro Docs](https://docs.astro.build)

## Deploy to WunderGraph Cloud

[![Deploy to WunderGraph](https://wundergraph.com/button)](https://cloud.wundergraph.com/new/clone?templateName=nextjs)

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
