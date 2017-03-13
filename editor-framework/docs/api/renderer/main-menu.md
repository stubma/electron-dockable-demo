# Editor.MainMenu

The main menu module for manipulating main menu items.

## Methods

### Editor.MainMenu.apply ()

Apply main menu changes.

### Editor.MainMenu.add (path, template)

  - `path` String - Menu path
  - `template` Array|Object - Menu template

Send `main-menu:add` to main process.

### Editor.MainMenu.init ()

Send `main-menu:init` to main process.

### Editor.MainMenu.remove (path)

  - `path` String - Menu path

Send `main-menu:remove` to main process.

### Editor.MainMenu.set (path, options)

  - `path` String - Menu path
  - `options` Object
    - `icon` NativeImage - A [NativeImage](http://electron.atom.io/docs/api/native-image/)
    - `enabled` Boolean
    - `visible` Boolean
    - `checked` Boolean - NOTE: You must set your menu-item type to 'checkbox' to make it work

Send `main-menu:set` to main process.

### Editor.MainMenu.update (path, template)

  - `path` String - Menu path
  - `template` Array|Object - Menu template

Send `main-menu:update` to main process.
