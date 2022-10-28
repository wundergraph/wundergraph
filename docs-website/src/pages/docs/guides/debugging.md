---
title: Debugging
pageTitle: WunderGraph - Debugging
description: This guide provides a configuration for debugging your WunderGraph applications with your IDE
---

## Visual Studio Code

- Install [Go language support for VSCode](https://marketplace.visualstudio.com/items?itemName=golang.Go). Make sure to install additonal tools when they pop up, or manually run `Go: Install/Update Tools command` from the command palette.

- Add the configuration to your `launch.json` file. Replace MY_CODE_DIR with the absolute path to your project's `.wundergraph` directory.

```
{
    "name": "Launch WunderGraph",
    "type": "go",
    "request": "launch",
    "mode": "auto",
    "program": "${workspaceFolder}/cmd/wunderctl/main.go",
    "args": ["up", "--debug", "--wundergraph-dir", "MY_CODE_DIR/.wundergraph"],
    "envFile": "MY_CODE_DIR/.env",
}
```

- Set your breakpoints and run "Launch WunderGraph" from the debug menu.
