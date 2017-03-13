# Lifecycle callbacks

You can define lifecycle callbacks, events, and IPC messages in the app definition by calling `Editor.App.extend`:

### beforeInit(yargs)

 - `yargs` Object - An instance of [yargs](https://github.com/yargs/yargs)

Invoked at the very beginning of the app, before Editor module initialization. No method in `Editor` module can be used in this phase.

The `beforeInit` phase is designed for setting command line options (defined within the `yargs` object). You can add additional commands for your app within this function.

**Example:**

```javascript
Editor.App.extend({
  beforeInit: ( yargs ) => {
    yargs
      .usage('[options] <project-path>')
      .options({
        'path': { type: 'string', desc: 'Open a project by path' },
        'nologin': { type: 'boolean', desc: 'Do not require login in dev mode' },
      });
  },
});
```

### init(opts, callback)

 - `opts` Object - The options parsed from `process.argv`
 - `callback` Function - Calling this function will complete the initialization.

This function will be invoked after `Editor` and its sub-modules have been initialized. The init phase is asynchronous and accepts a callback which is to be called to notify the app that initialization is complete. It is recommended to put the following steps in this function:

 - register your protocol
 - register your profile path
 - init your modules
 - invoke `Editor.init` to specify runtime-specific configuration for your application

**Example:**

```javascript
const Path = require('path');

Editor.App.extend({
  init ( opts, callback ) {
    Editor.init({
      'profile': {
        local: Path.join(Editor.App.path, '.settings'),
      },
      'package-search-path': [
        Editor.url('app://my-packages/'),
        Path.join(Editor.App.home, 'packages'),
      ],
      'panel-window': 'app://window.html',
      'layout': Editor.url('app://layout.json')
    });

    callback ();
  },
});
```

### run()

This function will be invoked after all packages are loaded. A common use case is to open your main window within this function.

**Example:**

```javascript
// extends the app
Editor.App.extend({
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

### quit(callback)

This function will be invoked when the Editor is closing. You need to manually invoke callback otherwise
the application will not quit.

```javascript
// extends the app
Editor.App.extend({
  // quit your app
  quit ( callback ) {
    Editor.log('Do some quit stuff...');
    callback();
  },
});
```

### loadPackage(pjson, callback)

A callback to be executed when a package has completed loading:

*TODO: A more concrete example is needed here*

```javascript
Editor.App.extend({
  loadPackage ( pjson, callback ) {
    if ( pjson.myKeyword ) {
      // procedures to run after package finished loading
    }

    callback();
  },
});
```

### unloadPackage(pjson)

A callback to be executed when a package has completed unloading:

*TODO: A more concrete example is needed here*

```javascript
Editor.App.extend({
  unloadPackage ( pjson ) {
    if ( pjson.myKeyword ) {
      // procedures to run after package finished unloading
    }
  },
});
```
