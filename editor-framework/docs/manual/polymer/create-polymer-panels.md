You can define a polymer element as your panel frame, just create a html file like this:

```html
<dom-module id="simple-panel">
  <style>
    :host {
      display: flex;
      flex-wrap: nowrap;
      align-items: stretch;
      flex-direction: column;
    }
  </style>

  <template>
    This is a simple panel
  </template>

  <script>
    Editor.polymerPanel('simple', {
      // ...
    });
  </script>
</dom-module>
```

After that in your `package.json`'s `panel` field, assign the html path to the `main` field, also add
an additional `ui` field equal to `"polymer"`. Here is the json file:

```json
{
  "name": "simple",
  "panel": {
    "main": "panel/panel.html",
    "ui": "polymer",
    "type": "dockable",
    "title": "Simple",
    "width": 800,
    "height": 600
  }
}
```
