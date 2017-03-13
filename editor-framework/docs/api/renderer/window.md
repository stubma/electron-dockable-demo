# Editor.Window

## Methods

### Editor.Window.open (name, url, options)

  - `name` String
  - `url` String
  - `options` Object

Open a new `Editor.Window` with `options` and load `url`.

### Editor.Window.focus ()

Focus on current window.

### Editor.Window.load (url, argv)

  - `url` String
  - `argv` Object

Load `url` in current window.

### Editor.Window.resize (w, h, useContentSize)

  - `w` Number
  - `h` Number
  - `useContentSize` Boolean

Resize current window.

### Editor.Window.resizeSync (w, h, useContentSize)

  - `w` Number
  - `h` Number
  - `useContentSize` Boolean

Resize current window synchronously.

### Editor.Window.center ()

Center the window.

## IPC Messages

### Message: 'editor:window-inspect'

Turn on the inspect element mode.
