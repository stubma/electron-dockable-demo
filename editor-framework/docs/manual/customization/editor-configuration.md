# Editor Configuration

You can setup the runtime-specific configuration for your application in `Editor.init()`.

## Options

### i18n (Object)

Specify i18n phrases for your application. The phrases is an Object like this:

```javascript
{
  text_id_01: 'Foo',
  text_id_02: 'Bar',
  text_group: {
    foo: 'Foo (group)',
    bar: 'Bar (group)',
  }
}
```

Usually we save i18n phrases in a file, and require it in `Editor.init` with `Editor.lang`. This allow us choose different language before we start the application.
For example:

```javascript
Editor.init({
  i18n: require(`./i18n/${Editor.lang}`)
});
```

### layout (String)

Specify the layout file used as default layout for your application.

### main-menu (Function)

A function returns the main menu template. Check [Electron's Menu Guide](http://electron.atom.io/docs/api/menu/) to learn how to write menu template.

### profile (Object)

Register profile name to path table used in `Editor.Profile` module.

### package-search-path (Array)

Paths to search packages.

### panel-window (String)

Specify a html file that used as panel window entry page.

### selection (Object)

Register selection type that used in `Editor.Selection` module.

### theme (String)

The name of the theme we would like to search for in `theme://` protocol

### theme-search-path (Array)

Paths to search in `theme://` protocol.

Example:

```javascript
Editor.init({
  'theme-search-path': [
    'app://themes',
  ],
  theme: 'default'
});
```

The example above will make the `theme://` protocol start searching files under `${your-app-path}/themes/default/`

### undo

TODO: should we need this ?
