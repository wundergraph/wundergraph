---
title: Debugging
pageTitle: WunderGraph - Debugging
description: This guide provides a configuration for debugging your WunderGraph applications with your IDE
---

# Debugging your WunderGraph application

## Visual Studio Code

Visual Studio code has builtin support for debugging JavaScript/TypeScript.

The easiest solution to debug your hooks a functions in your WunderGraph application is to use
the `JavaScript Debug Terminal` by selecting the `TERMINAL` tab in the bottom pane, clicking
the `+` symbol and opening a `Javascript Debug Terminal`:

![JavaScript Debug Terminal in Visual Studio Code](/images/debugging_vscode.png)

Launch your application from this new terminal, either using `npm start` or `wunderctl up` directly,
and execution will stop at your breakpoints.

# Debugging the WunderGraph server

Although less common than debugging your code, sometimes it might be useful to debug the WunderGraph server,
written in Go.

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
