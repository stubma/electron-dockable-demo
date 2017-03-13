# Create a Polymer Element

You can register custom polymer element for your panel ui.

## Register Polymer Element

Create a element html file `simple-widget.html` in your package:

```html
<dom-module id="simple-widget">
  <style>
    :host {
      color: red;
    }
  </style>

  <template>
    This is a simple widget
  </template>

  <script>
    Editor.polymerElement({
      // ...
    });
  </script>
</dom-module>
```

## Reference Your Element

Once you register the package in package.json, you can reference the widget with package name as the route path like this:

```javascript
`packages://${package-name}/${your-width-file}`
```

For example, suppose you have a `simple-widget.html` in your package, you can import the widget like this:

```html
<link rel="import" href="packages://simple/simple-widget.html">
```

Then you can use this custom element in your template:

```html
<simple-widget></simple-widget>
```
