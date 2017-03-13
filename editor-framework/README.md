# Editor Framework

[Documentation](https://github.com/cocos-creator/editor-framework/tree/master/docs) |
[Downloads](https://github.com/cocos-creator/editor-framework/releases/) |
[Installation](#installation) |
[Features](#features)

[![Circle CI](https://circleci.com/gh/cocos-creator/editor-framework.svg?style=svg)](https://circleci.com/gh/cocos-creator/editor-framework)
[![Build Status](https://travis-ci.org/cocos-creator/editor-framework.svg?branch=master)](https://travis-ci.org/cocos-creator/editor-framework)
[![Build status](https://ci.appveyor.com/api/projects/status/ugkft1nmcy2wklrl?svg=true)](https://ci.appveyor.com/project/jwu/editor-framework)
[![bitHound Overall Score](https://www.bithound.io/github/cocos-creator/editor-framework/badges/score.svg)](https://www.bithound.io/github/cocos-creator/editor-framework)
[![Dependency Status](https://david-dm.org/cocos-creator/editor-framework.svg)](https://david-dm.org/cocos-creator/editor-framework)
[![devDependency Status](https://david-dm.org/cocos-creator/editor-framework/dev-status.svg)](https://david-dm.org/cocos-creator/editor-framework#info=devDependencies)

Editor-Framework gives you the power to quickly and easily write professional multi-panel desktop software in HTML5 and Node.js on top of [Electron](http://electron.atom.io).

At its core is a modular and extensible package management system and open-ended API that allow you to quickly prototype and build reusable UI components on the fly in a live, hot-reloadable development environment.

Internally, Editor-Framework conforms with Electron’s [main and renderer process architecture](http://electron.atom.io/docs/tutorial/quick-start/).
To make multiple windows communicate easily, Editor Framework extends Electron’s [main](http://electron.atom.io/docs/api/ipc-main/) and [renderer](http://electron.atom.io/docs/api/ipc-renderer/) IPC API, making it easier to send and receive callbacks between the main and renderer processes. In the renderer process, we use HTML5 Web Component standards (Custom Element and Shadow DOM) by default, and provide a set of builtin UI-Kit elements which you can use to extend existing widgets and panels. It's also possible to extend any existing UI framework such as Polymer, Vue.js, React, or any other UI framework you'd prefer to use..

**NOTE: editor-framework is currently under active development. The documentation is a little bit out of date, but still can help you get started. I will update the doc as soon as possible.**

![demo-01](https://cloud.githubusercontent.com/assets/174891/16065534/3480115a-32de-11e6-88ba-9bdb5f047602.png)

## Installation

Editor-Framework can simply be declared and imported like any other package in your project:


```bash
npm install --save editor-framework
```

## Usage

Here is a simple example for using Editor-Framework in your Electron project:

**package.json**

```json
{
  "name": "your app name",
  "version": "0.0.1",
  "description": "A simple app based on editor-framework.",
  "dependencies": {},
  "main": "main.js"
}
```

**main.js**

```javascript
const Editor = require('editor-framework');

Editor.App.extend({
  init ( opts, cb ) {
    Editor.init({
      'package-search-path': [
        Editor.url('app://packages/'),
      ],
    });

    if ( cb ) {
      cb ();
    }
  },

  run () {
    // create main window
    let mainWin = new Editor.Window('main', {
      title: 'Editor Framework',
      width: 900,
      height: 700,
      minWidth: 900,
      minHeight: 700,
      show: false,
      resizable: true,
    });
    Editor.Window.main = mainWin;

    // restore window size and position
    mainWin.restorePositionAndSize();

    // load and show main window
    mainWin.load( 'app://index.html' );
    mainWin.show();

    // open dev tools if needed
    if ( Editor.argv.showDevtools ) {
      // NOTE: open dev-tools before did-finish-load will make it insert an unused <style> in page-level
      mainWin.nativeWin.webContents.once('did-finish-load', function () {
        mainWin.openDevTools({
          detach: true
        });
      });
    }
    mainWin.focus();
  },
});
```

**index.html**

```html
<html>
  <head>
    <title>Main Window</title>
    <meta charset="utf-8">

    <style>
      #mainDock {
        position: relative;
      }
    </style>
  </head>

  <body class="layout vertical">
    <main-dock class="flex-1"></main-dock>
  </body>
</html>
```

## Features

- ### App Customization and Extensibility through modular Packages

 - Dynamically load and unload packages
 - Watch package changes and notify changes immediately
 - Hot reload your packages

- ### Panel and Window Management

 - Freely dock panels anywhere in multiple windows
 - Dynamically load user defined panels from a package
 - Easily register and respond to ipc messages for your panel
 - Easily register shortcuts (hotkeys) for your panel
 - Save and load panel profiles
 - Save and load panels layout in json

- ### Extensible Menus

 - Manipulate menu items by menu path (`foo/bar/foobar` for example)
 - Dynamically add and remove menu items
 - Dynamically change a menu item's state (enabled, checked, visible, ...)
 - Load user menus from packages

- ### Builtin UI-KIT Element Library

 - Several UI elements are included to boost your development productivity
    - `<ui-button>`
    - `<ui-checkbox>`
    - `<ui-color>` and `<ui-color-picker>`
    - `<ui-input>`
    - `<ui-num-input>`
    - `<ui-select>`
    - `<ui-slider>`
    - `<ui-text-area>`
    - and more...
 - A [ui-kit-preview](https://github.com/fireball-packages/ui-kit-preview) is included to help you learn and custom ui-kit
 - Develop ui elements by Custom Element and Shadow DOM
 - Allow users to customize their theme for ui elements
 - Can be integrated with any other UI frameworks (Polymer, Vue.js, React, ...)
 - Well designed for focus behavior (Use our own focus manager for better user experience)
 - Uniform events (`change`, `confirm` and `cancel`) in every ui element makes our ui-kit friendly for Undo/Redo functionality

- ### Customizable UI Properties

 - `<ui-prop>` elements help users write properties/inspector panel
 - Automatically detect and choose a view for the property by type
 - Allow users to register their own property type and customize the view for it
 - Support nested properties (for `object` type and `array` type)
 - Support disable, readonly property in hierarchy

- ### Customizable Profiles

 - Customize your profile for different scope (global, local, project, ...)
 - Load and save profiles through unified API

- ### Logging

 - Uniform log interface for main and renderer process
 - Sort and store all windows and main process logs in one place
 - Support log to file
 - Integrate with [console](https://github.com/fireball-packages/console) for displaying and querying your logs

- ### Enhanced Selection

 - Selection cached and synced among windows
 - User can register his own selection type
 - Automatically filtering selections

- ### Improved IPC

 - Enhance IPC Programming Experience
 - Allow sending ipc message to specific panel
 - Allow sending ipc message to specific window
 - Allow sending ipc request and waiting for the reply in callback function

- ### Undo & Redo Actions

 - Global Undo and Redo

- ### Test Driven Workflow

 - Integrate [node-tap](http://www.node-tap.org/) to the test framework
 - Detect your package changes and automatically run tests under it via [tester](https://github.com/fireball-packages/tester)
 - A helper module to simulate UI input (mouse, keyboard) to help user write panel tests
 - Automatically recreate your test target (windows, widgets, panels, ...) after each test case

## Development

### Getting Started

Clone the repo:

```bash
git clone https://github.com/cocos-creator/editor-framework
```

Run `npm install`:

```bash
npm install
npm run build # build styles
```

### Installing and Running the Examples

#### example-apps

[example-apps](https://github.com/editor-framework/example-apps) is a set of examples
shows how to create Editor-Framework Apps.

Installation:

```bash
git clone https://github.com/editor-framework/example-apps
```

Run:

```bash
npm start ./example-apps/${example-name}
```

#### example-packages

[example-packages](https://github.com/editor-framework/example-packages) is a set of examples
shows how to create Editor-Framework Apps.

Installation:

```bash
git clone https://github.com/editor-framework/example-packages
```

Run:

```bash
npm start ./example-packages/
```

#### demo

[demo](https://github.com/editor-framework/demo) is a demo project to help users develop their own packages.
To use the demo project, clone it first and go to the demo folder to install it.

Installation:

```bash
git clone https://github.com/editor-framework/demo
cd ./demo
npm install
bower install
gulp update
```

Run:

```bash
npm start ./demo
```

## License (MIT)

Copyright (c) 2015 Cocos Creator

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
