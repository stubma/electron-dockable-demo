Editor-Framework provides a rich and flexible toolset for building rich multi-window desktop application on top of Github's [Electron](https://github.com/electron/electron) platform.

It was designed with reusability, extensibility,

# Defining Your App

Since Editor-Framework is built on top of Electron, many of the Electron or Node.js workflow patterns you're used to will still apply.
However, there are some important conventions and configuration definitions Editor-Framework uses to load and run your app.

First, let's look at a typical file layout of an Editor-Framework app:

- `/your-application`
 - `entry_script.js`
 - `package.json`


The entry point to your application must be specified within the `"main"` field of your app's `package.json`:

Here is an example `package.json` file:

```json
{
  "name": "your app name",
  "version": "0.0.1",
  "description": "A simple app based on Editor-Framework.",
  "dependencies": {},
  "main": "main.js" // <== Important!!! This is required!
}
```

## Main Entry Script

In your main entry script (specified as `main.js` in the above `package.json` definition), extend `Editor.App` by passing an object definition to the `Editor.App.extend` function:


```javascript
'use strict';

// require Editor-Framework at the beginning
Editor = require('editor-framework');

// extends the app
Editor.App.extend({
  // optional, init yargs (command line arguments) before init() is called
  beforeInit ( yargs ) {
  },

  // init your app
  init ( opts, callback ) {
    // NOTE: you must at least call Editor.init() in this function
    Editor.init();

    callback ();
  },

  // run your app
  run () {
    // create main window
    let mainWin = new Editor.Window('main', {
      title: 'My App',
      minWidth: 800,
      minHeight: 600,
      show: false,
      resizable: true,
    });
    Editor.mainWindow = mainWin;

    // load your app page
    mainWin.load( 'app://index.html' );

    // show and focus the main window
    mainWin.show();
    mainWin.focus();
  },
});
```

Read more details about specifying your App definition in [App lifecycle and events](./app-lifecycle-and-events.md).

## Yeoman Generator

To make things simple, we also provide a yeoman generator to create an Editor-Framework app --- [generator-editor-framework](http://github.com/editor-framework/generator).

## Example: A very basic Editor-Framework application

### Directory structure

```plain
MyApplication/
  |--app.js
  |--index.html
  |--package.json
```


**package.json**

```json
{
  "name": "your-app-name",
  "version": "0.0.1",
  "description": "Perhaps the simplest possible Editor-Framework application",
  "dependencies": {},
  "main": "app.js"
}
```

**app.js**

```javascript
'use strict';

/**
 * Entry point for our application.
 * *Note that this file is the "main" file in package.json!*
 */

const Editor = require('../../index');

Editor.App.extend({

  /**
   * init is called once Editor Framework has completed its internal initialization.
   * Here, you may want to define any application-level configuration or behavior.
   *
   * @param opts An object representing the command line options used to start this Application
   * @param callback function that signals the parent process that initialization is complete.
   *    You'll want to call manually this within your `init` function once you're ready for the application
   *    to run
   */
  init (opts, callback) {
    Editor.init({
      'package-search-path': [
        Editor.url('app://package-doesnt-exist/')
      ]
      // An object defining application-level configuration options for initialization will go here  
    });

    Editor.success('main.js: call to init() completed successfully');

    // You'll need to call this directly to signal Editor-Framework that you're ready to run the application
    callback();
  },

  /**
   * Called by Editor-Framework after initialization is complete
   */
  run () {
    /** Create our main window. The two arguments below define the properties of this window and are required:
     *   - the name of the window ('main' in this case)
     *   - An object defining the parameters of the window
     */
    let mainWin = new Editor.Window('main', {
      title:     'Editor-Framework Basic Example',
      width:     900,
      height:    700,
      minWidth:  900,
      minHeight: 700,
      show:      false,
      resizable: true,
    });

    // Tell Editor that that is our root window.
    Editor.Window.main = mainWin;

    // restore window size and position
    mainWin.restorePositionAndSize();

    // page-level test case
    mainWin.load('app://index.html');

    // load and show main window
    mainWin.show();

    // open dev tools if needed
    if (Editor.argv.showDevtools) {
      // NOTE: open dev-tools before did-finish-load will make it insert an unused <style> in page-level
      mainWin.nativeWin.webContents.once('did-finish-load', function() {
        mainWin.openDevTools();
      });
    }

    mainWin.focus();

    Editor.success('main.js: call to run() completed successfully');
  },
});
```

**index.html**

```html
<html>
  <head>
    <title>Welcome to Editor-Framework!</title>
    <meta charset="utf-8">

    <style>
      body {
        margin: 10px;
      }

      h2 span {
        color: #090;
      }
    </style>
  </head>

  <body class="layout vertical">
    <h1>Welcome to Editor-Framework!</h1>
    <h3><em>This is a basic demo of an Editor-Framework application</em></h3>
    <pre>
      Application path:  <script>document.write(Editor.appPath)</script>
      NodeJS version:    <script>document.write(process.versions.node)</script>
      Chromium version:  <script>document.write(process.versions.chrome)</script>
      Electron version:  <script>document.write(process.versions.electron)</script>
    </pre>

    <script>
      Editor.success('index.html: \tWelcome to Editor-Framework!')
      Editor.log(`index.html: \tApplication Path: ${Editor.appPath}`)
      Editor.log(`index.html: \tNodeJS version: ${process.versions.node}`)
      Editor.log(`index.html: \tChromium version: ${process.versions.chrome}`)
      Editor.log(`index.html: \tElectron version: ${process.versions.electron}`)
    </script>
  </body>
</html>
```
	