# Registering Shortcuts

You can define keyboard shortcuts for your panel in `package.json`. Here is a simple example:

```json
"panel": {
  "shortcuts": {
    "command+k": "clear",
    "#props": {
      "command+delete": "delete"
    },
    "#view": {
      "command+delete": "delete"
    }
  }
}
```

The shortcut is directly bound to a method in your panel frame. Just make sure you have defined the method otherwise the framework will raise a warning.

Editor-Framework allows you to register a shortcut for a specific element in your panel frame. In this way, you can better manage your key mappings when focused on different elements.

To achieve this, just add an `id` in your sub-element, and write the id selector (a.k.a `#{your-id}`) as a key in the shortcut and define the key mappings within it.

You can learn more about this in [shortcuts-demo](https://github.com/cocos-creator/editor-framework/tree/master/demo/shortcuts)
