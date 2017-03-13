# Creating Panels

In Editor-Framework, a `Panel` acts like a dockable "mini-window". Each panel contains a panel frame.

You can extend a panel frame and register it in `package.json`. Editor-Framework will dynamically then load and instantiate your panel frame when the panel is opened.

## Step 1: Add the panel definition to your package.json

Then save it to your package's `panel` field:

```json
{
  "name": "simple",
  "panel": {
    "main": "panel/panel.js",
    "type": "dockable",
    "title": "Simple Panel Title",
    "width": 800,
    "height": 600
  }
}
```

Additional `package.json` options:

 - `main`: String (path) - Panel's main entry file.
 - `type`: String - Panel's type, can be `'dockable'`, `'float'`, `'fixed-size'`, `'quick'` and `'simple'`. Default is `'dockable'`
 - `title` String - Panel window's title in tab.
 - `frame` Boolean - Specify false to create a Frameless Window. Default is true.
 - `resizable` Boolean - Indicate if the window can be resized. Default is true.
 - `popable` Boolean - Default is `true`, indicates if the panel is popable.
 - `shadow-dom` Boolean - Default is `true`, indicates if the panel-frame should use shadow-dom
 - `width` Integer - Panel window’s width in pixels. Default is 400.
 - `height` Integer - Panel window’s height in pixels. Default is 400.
 - `min-width` Integer - Panel window’s minimum width. Default is 200.
 - `min-height` Integer - Panel window’s minimum height. Default is 200.
 - `max-width` Integer - Panel window’s maximum width.
 - `max-height` Integer - Panel window’s maximum height.
 - `shortcuts` Object - The keyboard shortcut for the panel.
   - `key` String - defines the key combination (example: `command+k`).
   - `value` String - The method name defined in the panel frame.
 - `profiles` Object - The list of default profile settings.
   - `key` String - The profile type, by default it can be `local` or `global`. You can register more profile types through `Editor.registerProfilePath`.
   - `value` Object - The default setting values.
 - `ui` String (Deprecated) - The ui-framework used in this panel. Default is `none`, can be `polymer`.

## Step 2: Define the main script for your panel frame

To define a panel frame, first create a javascript file like this (for instance in `panel/panel.js`):

```javascript
Editor.Panel.extend({
  style: `
    h1 {
      color: #09f;
    }
  `,

  template: `
    <h1>This is a simple panel</h1>
  `,

  ready () {
  },
});
```

Available options to be passed to `extend` include:

- `template` (string): Raw HTML to be rendered as contents of panel.
- `style` (string): Raw CSS Styles to be accessible within panel.
- `dependencies` (array of strings): List of dependency paths to be loaded asynchronously.
- `listeners` (object): Mapping for DOM event definitions and their respective callbacks. The callback function will be executed whenever it's matching key is received by this package's listener.
- `messages` (object): Mapping for IPC message definitions and their respective callbacks. The callback function will be executed whenever it's matching key is received by this package's listener.
- `$` (array of strings): Mapping for DOM element by css selector.

## Step 3: Opening the panel:

Once your package is loaded, you can use `Editor.Panel.open('simple')` to open your panel. Note that the argument passed to `Editor.Panel.open` corresponds to the `name` field in the package's JSON definition.

### Panel ID

A Panel-ID is a string of the format `{package-name}{panel-suffix-name}`, where `panel-suffix-name` is the string after `panel`.
It is used in most of the functions in `Editor.Panel` that need to operate on a specific panel.

Suppose we have the following `package.json` file:

```json
{
  "name": "foo",
  "panel": {
    "frame": "panel/simple.html"
  },
  "panel.02": {
    "frame": "panel/simple.html"
  },
  "panel-03": {
    "frame": "panel/simple.html"
  },
  "panel@04": {
    "frame": "panel/simple.html"
  }
}
```

The file registers four panels `panel`, `panel.02`, `panel-03` and `panel@04`,
which correspond to the four panel IDs: `foo`, `foo.02`, `foo-03` and `foo@04`.
