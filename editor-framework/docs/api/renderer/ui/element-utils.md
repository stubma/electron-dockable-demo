# Editor.UI (Element Utils Module)

## Methods

### Editor.UI.getProperty (type)

  - `type` String

Get registered property via `type`.

### Editor.UI.parseArray (txt)

  - `txt` String

Parse `txt` as an array.

### Editor.UI.parseBoolean (txt)

  - `txt` String

Parse `txt` as a boolean value.

### Editor.UI.parseColor (txt)

  - `txt` String

Parse `txt` as a color object.

### Editor.UI.parseObject (txt)

  - `txt` String

Parse `txt` as an object.

### Editor.UI.parseString (txt)

  - `txt` String

Parse `txt` as a string.

### Editor.UI.regenProperty (propEL, cb)

  - `propEL` HTMLElement
  - `cb` Function

Regenerate property at `propEL`.

### Editor.UI.registerElement (name, def)

  - `name` String
  - `def` Object

Register a custom element.

### Editor.UI.registerProperty (type, protoOrUrl)

  - `type` String
  - `protoOrUrl` Object|String

Register a custom property.

### Editor.UI.unregisterProperty (type)

  - `type` String

Unregister a custom property.
