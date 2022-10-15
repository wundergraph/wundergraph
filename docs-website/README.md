# WunderGraph Documentation

WunderGraph documentation site built using [Tailwind CSS](https://tailwindcss.com) and [Next.js](https://nextjs.org).

## How to add internal links to the documentation

Do not directly add links between docs pages.
If we did this, we'd have to maintain that all these links are correct.
Instead, use "tagging" which takes a sequence of characters and adds a link to the corresponding page.

Here's an example that directly adds a link, don't do it like this:

```md
We will use [Default Environment Variables](/docs/architecture/wundergraph-conventions#wundergraph-default-environment-variables) to generate the config.
```

Instead, add a tag to `docs-website/markdoc/tags.js` and link it to the correct page.
This will ensure that all links are in one place and can easily be changed without going through all the docs manually.

## Getting started

To get started with this project, first configure your secrets:

```bash
cp .env.example .env.local
```

Next, run the development server:

```bash
pnpm dev
```

Finally, open [http://localhost:3005](http://localhost:3005) in your browser to view the website.

## Customizing

You can start editing this project by modifying the files in the `/src` folder. The site will auto-update as you edit these files.

## Learn more

To learn more about the technologies used in this site template, see the following resources:

- [Tailwind CSS](https://tailwindcss.com/docs) - the official Tailwind CSS documentation
- [Next.js](https://nextjs.org/docs) - the official Next.js documentation
- [Headless UI](https://headlessui.dev) - the official Headless UI documentation
- [Markdoc](https://markdoc.io) - the official Markdoc documentation
- [DocSearch](https://docsearch.algolia.com) - the official DocSearch documentation
