# Editor.JS

Extending JavaScript to better handle property and class inheritance.

## Methods

### Editor.JS.addon (obj, ...args)

  - `obj` Object
  - `...args` Object

Copy all properties not defined in obj from arguments[1...n] to it.

### Editor.JS.assign (obj, ...args)

  - `obj` Object
  - `...args` Object

Copy all properties from arguments[1...n] to `obj`, return the mixed result.

### Editor.JS.assignExcept (obj, src, except)

  - `obj` Object
  - `src` Object
  - `except` Array

Copy all properties from arguments[1...n] to `obj` except the specific ones.

### Editor.JS.clear (obj)

  - `obj` Object

Removes all enumerable properties from object.

### Editor.JS.copyprop (name, source, target)

  - `name` String
  - `source` Object
  - `target` Object

Copy property by name from source to target.

### Editor.JS.extend (cls, base)

  - `cls` Function
  - `base` Function

Derive the class from the supplied base class.

### Editor.JS.extract (obj, propNames)

  - `obj` Object
  - `except` Array(String)

Extract properties by `propNames` from `obj`, return the extracted result.

### Editor.JS.getPropertyByPath (obj, path)

  - `obj` Object
  - `path` String

Get property by path.
