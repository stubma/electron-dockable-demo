# Editor.Menu

## Class: Editor.Menu

### new Editor.Menu (template[, webContents])

  - `template` Array|Object - Menu template for initialize. The template take the options of [Electron's Menu Item](http://electron.atom.io/docs/api/menu-item/)
    - `path` String - add a menu item by path.
    - `message` String - Ipc message name.
    - `command` String - A global function in main process (e.g. Editor.log).
    - `params` Array - The parameters passed through ipc.
    - `panel` String - The panelID, if specified, the message will send to panel.
    - `dev` String - Only show when Menu.showDev is true.
  - `webContents` Object - A [WebContents](http://electron.atom.io/docs/api/web-contents/) object.

## Instance Methods

### menu.add (path, template)

  - `path` String - The menu path
  - `template` Array|Object

Build a template into menu item and add it to path

Example:

```js
let editorMenu = new Editor.Menu();
editorMenu.add( 'foo/bar', {
  label: foobar,
  message: 'foobar:say',
  params: ['foobar: hello!']
});

// you can also create menu without label
// it will add menu to foo/bar where bar is the menu-item
let editorMenu = new Editor.Menu();
editorMenu.add( 'foo/bar/foobar', {
  message: 'foobar:say',
  params: ['foobar: hello!']
});
```

### menu.clear ()

Clear all menu item in it.

### menu.dispose ()

De-reference the native menu.

### menu.insert (path, pos, template)

  - `path` String - The menu path
  - `pos` Number
  - `template` Array|Object

Build a template into menu item and insert it to path at specific position

### menu.remove (path)

Remove menu item at path.

### menu.reset (template)

  - `template` Array|Object

Reset the menu from the template.

### menu.set (path, options)

  - `path` - The menu path
  - `options`
    - `icon` NativeImage - A [NativeImage](http://electron.atom.io/docs/api/native-image/)
    - `enabled` Boolean
    - `visible` Boolean
    - `checked` Boolean -  NOTE: You must set your menu-item type to 'checkbox' to make it work

### menu.update (path, template)

  - `path` String - The menu path
  - `template` Array|Object

Update menu item at path.

## Static Properties

### Editor.Menu.showDev

Indicate if show dev menu

## Static Methods

### Editor.Menu.convert (template[, webContents])

  - `template` Array|Object - Menu template for initialize. The template take the options of [Electron's Menu Item](http://electron.atom.io/docs/api/menu-item/)
  - `webContents` Object - A [WebContents](http://electron.atom.io/docs/api/web-contents/) object.

Convert the menu template to process additional keyword we added for Electron.
If webContents provided, the `template.message` will send to the target webContents.

### Editor.Menu.getMenu (name)

  - `name` String - Name of the register menu

### Editor.Menu.register (name, fn[, force])

  - `name` String - Name of the register menu
  - `fn` Function - A function returns the menu template
  - `force` Boolean - Force to register a menu even it was registered before

### Editor.Menu.unregister (name)

  - `name` String - Name of the register menu

### Editor.Menu.walk (template, fn)

  - `template` Array|Object - Menu template for initialize. The template take the options of [Electron's Menu Item](http://electron.atom.io/docs/api/menu-item/)
  - `fn` Functoin - Function applied to each menu item

Example:

```js  
Editor.Menu.walk(menuTmpl, item => {
  if ( item.params ) {
    item.params.unshift('Hello');
  }

  if (item.message === 'foobar:say-hello') {
    item.enabled = false;
  }
});
```

## IPC Messages

### Message: 'menu:popup'

### Message: 'menu:register'
