# Panel Frame Reference

A simple panel frame definition:

```
Editor.Panel.extend({
  style: `
    :host { margin: 5px; }
    h2 { color: #f90; }
  `,

  template: `
    <h2>Hello World!</h2>
  `,

  ready () {
    Editor.log('Hello World!');
  },
});
```

## Lifecycle Callbacks

### ready()

Invoked after the panel has been loaded successfully and is ready to be shown

### run(argv)

Invoked when panel opened or panel is shown through `Editor.Panel.open`. The `argv` is an `Object` that you send through the `Editor.Panel.open` call.

### close()

Invoked after is panel or its parent window is closed.

## Properties

### style (String)

Raw CSS Styles to be accessible within panel.

The CSS Styles is defined under [Shadow DOM v1](https://developers.google.com/web/fundamentals/primers/shadowdom/), so it obey the style rules for shadow dom. For example, you can use the selector `:host` to represent the panel frame itself.

Since the panel frame is live in shadow dom, the style is isolated.

### template (String)

Raw HTML to be rendered as contents of panel.

### listeners (Object)

Mapping for DOM event definitions and their respective callbacks. The callback function will be executed whenever it's matching key is received by this package's listener.

Example:

```javascript
Editor.Panel.extend({
  /// ...
  listeners: {
    mousedown ( event ) {
      event.stopPropagation();
      Editor.log('on mousedown');
    },

    'panel-resize' ( event ) {
      event.stopPropagation();
      Editor.log('on panel resize');
    }
  }
});
```

### messages (Object)

Mapping for IPC message definitions and their respective callbacks. The callback function will be executed whenever it's matching key is received by this package's listener.

Example:

```javascript
Editor.Panel.extend({
  // ...
  messages: {
    'my-package:say-hello' ( event ) {
      Editor.log('Hello!');
    },
  }
});
```

### behaviors

TODO

### dependencies (Array)

List of dependency paths to be loaded asynchronously.

Example:

```javascript
Editor.Panel.extend({
  // ...
  dependencies: [
    'packages://my-package/index.js',
  ],  
});
```

### $

Mapping for DOM element by css selector.

For example, if your template HTML contained a selector `<span id="my_title">Title</span>`, when you define `myTile: '#my_title'` in `$` then could access its DOM node from
the code code using `$myTitle`:

```javascript
// In panel/panel.js:
Editor.Panel.extend({
  template: `
    <div><span id="my_title">Title</span></div>
  `,
  $: {
    myTitle: "#my_title"
  },

  /// ...
});

ready () {
  let myTitleElm = this.$myTitle;
  /// ...
},
```

## DOM Events

### panel-show

Emitted immediately after any time the panel is shown.

### panel-hide

Emitted immediately after any time the panel is hidden.

### panel-resize

Emitted when the panel is resized.

### panel-cut

Emitted when content in the panel is cut.

### panel-copy

Emitted when content in the panel is copied.

### panel-paste

Emitted when content is pasted in the panel.
