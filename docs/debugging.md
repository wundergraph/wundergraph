# Debugging WunderGraph

## VSCode

1. Install [Go language support for VSCode](https://marketplace.visualstudio.com/items?itemName=golang.Go). Make sure to install additonal tools when they pop up, or manually run `Go: Install/Update Tools command` from the command palette.

2. Add the configuration to your `launch.json` file. Replace MY_CODE_DIR with the absolute path to your projects `.wundergraph` folder.

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

3. Set your breakpoints and run "Launch WunderGraph" from the debug menu.
