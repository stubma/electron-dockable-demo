# Extending Main Menu

You can freely extend the main menu for your App through package. Just editing the `main-menu` field in your `package.json`.

Here is an example:

```json
"main-menu": {
  "Examples/Simple": {
    "message": "my-package:open"
  },
  "Examples/Advanced": {
    "message": "my-package:advance"
  }
}
```

Once you save your changes, the package will be reloaded, and you will see in "Main Menu" -> "Examples" there adds two new menu item "Simple" and "Advanced".

## Menu Path

Menu paths are defined in the `main-menu` property of `pacakge.json`.

A menu path looks like `Menu Name/Item Name`. You can also write `Menu Name/Group Name/Item Name`, which results in the following menu:
![image](https://cloud.githubusercontent.com/assets/344547/8249697/89da532e-169f-11e5-9f69-d49731ea0ca6.png)

### What if the menu path already exists

Sometimes we will meet the same menu path in different packages. If this happens, the later loaded package will win the registry.

### What if the parent of the menu path has been registered

Unlike the above one, the menu path you trying to register is clean, but its parent has been registered. For example like this:

Package 01

```json
{
  "main-menu": {
    "Examples/Foobar": {
      "message": "my-package:foo"
    }
  }
}
```

Package 02

```json
{
  "main-menu": {
    "Examples/Foobar/Bar": {
      "message": "my-package:bar"
    }
  }
}
```

The "Examples/Foobar" has been registered as a menu item in Package 01, so when we start loading Package 02, it tries to register "Examples/Foobar/Bar"
under "Examples/Foobar". This requires the "Examples/Foobar" to be a submenu not a menu item. So the registry will be failed and an error will show up afterward.

## Options

The menu option is build on top of [Electron's Menu Item](http://electron.atom.io/docs/api/menu-item/). Most of the options are available except the `click` since json file doesn't support function. We use `message` and `params` to replace of the `click` function. Below is an example for this:

```json
"main-menu": {
  "Examples/Say Hello": {
    "message": "my-package:say-hello",
    "params": ["Hello World!"]
  }
}
```

When the menu item is clicked, it sends an IPC message `my-package:say-hello` to the main process with the params `"Hello World!"` we defined above.

### message (String)

IPC message name.

### command (String)

Just like the message, but instead of sending an IPC message, it will directly invoke a function directly in main process. An example shows this:

```json
"main-menu": {
  "Examples/Say Hello": {
    "command": "Editor.log",
    "params": ["Hello World!"]
  }
}
```

**NOTE:** you can only choose to use `message` or `command` in one menu item.

### params (Array)

The parameters sent in IPC message.

### accelerator (String)

Check [Accelerator](http://electron.atom.io/docs/api/accelerator/) for more details.

### icon (String)

The path of your icon file relate to your package path.

### visible (Boolean)

Specify if the menu item is visible at the beginning.

### enabled (Boolean)

Specify if the menu item is enabled at the beginning.
