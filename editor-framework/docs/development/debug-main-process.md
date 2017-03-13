# Debugging the Main Process

Debugging the main process in Editor-Framework is the same as Electron. You can find the
details in Electron's documentation --- [Debugging the Main Process](http://electron.atom.io/docs/tutorial/debugging-main-process/). However,
Editor-Framework simplifies this further by providing a menu option and build script.

## Build and install node-inspector for Electron

Just run:

```bash
npm run build:node-inspector
```

It will automatically install and rebuild node-inspector by following Electron's instructions: [Use node-inspector for Debugging](http://electron.atom.io/docs/tutorial/debugging-main-process/#use-node-inspector-for-debugging).

## Run node-inspector

Once you install the node-inspector above, run Editor-Framework, and go to the menu item: `Main Menu / Developer / Debug Main Process (Node Inspector)`.

If all goes well, you will see a console log with something similar to:

```
node-inspector started: http://127.0.0.1:8080/debug?ws=127.0.0.1:8080&port=3030
```

Now you can open your Chrome browser and paste the url to start debugging the main process.
