# Custom Protocol

## Builtin Protocol

Due to the complicated nature of path lookup between main and renderer processes, we created the following custom protocols to provide easy and consistent access to key file locations:

  - `editor-framework://`: Map to the Editor-Framework module path.
  - `app://`: Map to the root path of your app.
  - `packages://{package-name}`: Map to the `{package-name}` path.
  - `theme://`: Map to the `{theme-search-path}/{theme}` path.

If you know exactly how to reference a resource in your script, you can use an absolute path or relative path as well.

A Url with custom protocols can also be used directly in an HTML or CSS import. In the main/renderer process, you can write:

```js
var myFilePath = Editor.url('app://myfolder/myfile.js');
```

Furthermore, the `Editor.url` method will convert your url to an absolute path of the file system of your OS.

## Register A Custom Protocol

TODO
