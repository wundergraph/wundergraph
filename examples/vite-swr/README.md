# WunderGraph Vite + SWR Starter

This example demonstrates how to use WunderGraph with [Vite](https://vitejs.dev/) and [SWR](https://swr.vercel.app).

Vite is a new build tool that aims to provide a faster and leaner development experience for modern web projects. It is built on top of [Rollup](https://rollupjs.org/guide/en/) and [esbuild](https://esbuild.github.io/).

SWR is a React library for data fetching. With just one hook, you can significantly simplify the data fetching logic in your project. And it also covered in all aspects of speed, correctness, and stability to help you build better experiences.

## Getting Started

1. Copy the `.env.example` file to `.env` and fill in the required values.
2. Install the dependencies and run the complete example in one command:

```shell
npm install && npm start
```

After a while, a new browser tab will open,
and you can start exploring the application.
If no tab is open, navigate to [http://localhost:5173](http://localhost:5173).

Running WunderGraph will automatically introspect the data-source and generate an API for you.
You can add more Operations (e.g. Queries or Mutations) by adding more "\*.graphql" files to the directory `./wundergraph/operations`.
Each file becomes an Operation. The Operation name is not relevant, the file name is.

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Deploy to WunderGraph Cloud

[![Deploy to WunderGraph](https://wundergraph.com/button)](https://cloud.wundergraph.com/new/clone?templateName=vite-swr)

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
