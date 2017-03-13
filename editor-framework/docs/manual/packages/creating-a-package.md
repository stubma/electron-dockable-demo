# Creating a Package

Editor-Framework loads packages before App runs. By default it loads packages from `editor-framework://builtin/` and `~/.{app-name}/packages/`.

You can customize the location it loads packages from through the `package-search-path` option in `Editor.init(opts)` method in your `App.init` function.

## Structure

In general, packages should have the following structure:

```plain
MyPackage
  |--panel(optional)
  |  |--panel.js
  |--main.js
  |--package.json
```

Some key parts explained:

- `main.js`: main entry file, read the [Main Entry](#main-entry) section.
- `package.json`: package description file, not used for [npm](https://www.npmjs.com/), read [Package Description](#package-description) section.
- `panel`: this folder is necessary if your package needs to open a panel to work.

For panels and widgets, you can combine scripts and styles into a single html file. See [this simple test case](../../../test/fixtures/packages/simple/panel/panel.js) as an example. You can also write script and styles in any file format that compiles to JavaScript or CSS, such as [coffeescript](http://coffeescript.org/), [stylus](https://learnboost.github.io/stylus/), [less](http://lesscss.org/), [sass](http://sass-lang.com/). Check out [Building Packages](./load-and-build-packages.md) documentation for details.

## Package Description

Each package is described via a `package.json` file. Place this file in your package's project folder.

For example:

```js
{
  "name": "demo-simple",
  "version": "0.0.1",
  "description": "Simple Demo",
  "author": "Firebox Technology",
  "main": "main.js",
  "menus": {
    "Examples/Simple": {
      "message": "demo-simple:open"
    }
  },
  "panel": {
    "main": "panel/index.js",
    "type": "dockable",
    "title": "Simple",
    "width": 800,
    "height": 600
  }
}
```

Explanation for each key-value pair:

  - `name` *String* - Name of the package, this name must be unique, otherwise it cannot be published online.
  - `version` *String* - The version number that follows [semver](http://semver.org/) pattern.
  - `description` *String* (Optional) - A simple description of what your package does.
  - `author` *String* (Optional) - Who created this package.
  - `build` *Boolean* (Optional) - If build the package to `bin/dev`
  - `hosts` *Object* (Optional) - The version of the hosts required for this package.
  - `main` *String* (Optional) - A file path to the main entry javascript. Usually `main.js`, you can also use another filename and specify it here.
  - `main-menu` *Object* (Optional) - The main menu registry list.
    - `key` *String* - Menu path, example: `foo/bar/foobar`
    - `value` *Object* - Menu options
      - [Editor Menu Template](http://electron.atom.io/docs/api/menu-item/)
  - `panel[.sub-name]` *Object* (Optional) - Pa nel info
    - [Detail of Panel Info](./creating-panels.md)
  - `packages` *Object* (Optional) - The Editor-Framework package dependencies list.
  - `dependencies` *Object* (Optional) - The node module dependencies list.

## Main Entry

The `main.js` file (or any file you register under `"main"` in `package.json`) serves as the entry file of the package program. A typical example looks like this:

```js
'use strict';

module.exports = {
  load () {
    // callback when package has been loaded
  },

  unload () {
    // callback when package has been unloaded
  },

  // an IPC message receiver
  messages: {
    open () {
      Editor.Panel.open('demo-simple');  // The "demo-simple:open" action will open this package via `Editor.Panel.open`
    },
  }
};
```

### module.exports

Editor-Framework runs each package's main entry as a module with `require`, so you must expose properties and methods in your main entry using `module.exports`. See [Node.js module API docs](https://nodejs.org/api/modules.html#modules_module_exports) for details.

### IPC Message

In the above example, the main entry listens to an IPC message `open` (it is short name for `demo-simple:open`) and calls `Editor.Panel.open` to open a package panel. This is the most common way to open a package panel. To learn more about IPC messages and how package communicate between main and renderer process, read [IPC Channel docs](ipc-channel.md).

Note that the the initial `demo-simple:open` message is registered in the `main-menu['Examples/Simple'].message` property of `package.json`. See the above `package.json` example.

### Main Process

The "main" entry in `package.json` specifies the entry for the main process. Within the main process you can:

- Use the full [Node.js API](https://nodejs.org/api/)
- Use [Electron's API](http://electron.atom.io/docs/) that is listed under 'modules for the main process' or 'modules for both processes'
- Require any main, local or npm module (for npm modules).
