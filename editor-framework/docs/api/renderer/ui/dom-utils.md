# Editor.UI (DOM Utils Module)

## Methods

### Editor.UI.createStyleElement (url)

  - `url` String

Load `url` content and create a style element to wrap it.

### Editor.UI.clear (element)

  - `element` HTMLElement

Remove all child element.

### Editor.UI.index (element)

  - `element` HTMLElement

Get the index of the `element`

### Editor.UI.parentElement (element)

  - `element` HTMLElement

Get the parent element, it will go through the host if it is a shadow element.

### Editor.UI.offsetTo (el, parentEL)

  - `el` HTMLElement
  - `parentEL` HTMLElement

Returns the offset `{x, y}` from `el` to `parentEL`

### Editor.UI.walk (el, [opts,] cb)

  - `el` HTMLElement
  - `opts` Object
    - `diveToShadow` Boolean
    - `excludeSelf` Boolean
  - `cb` Function

Recursively search children use depth first algorithm.

### Editor.UI.fire (element, eventName, opts)

  - `element` HTMLElement
  - `eventName` String
  - `opts` Object

Fires a CustomEvent to the specific element. Example:

```js
Editor.fire(el, 'foobar', {
  bubbles: false,
  detail: {
    value: 'Hello World!'
  }
});
```

### Editor.UI.acceptEvent (event)

  - `event` Event

Call preventDefault and stopImmediatePropagation for the event

### Editor.UI.installDownUpEvent (element)

  - `element` HTMLElement

Handle mouse down and up event for button like element

### Editor.UI.inDocument (el)

  - `el` HTMLElement

Check if the element is in document

### Editor.UI.inPanel (el)

  - `el` HTMLElement

Check if the element is in panel

### Editor.UI.isVisible (el)

  - `el` HTMLElement

Check if the element is visible by itself

### Editor.UI.isVisibleInHierarchy (el)

  - `el` HTMLElement

Check if the element is visible in hierarchy

### Editor.UI.startDrag (cursor, event, onMove, onEnd)

  - `cursor` String - CSS cursor
  - `event` Event
  - `onMove` Function
  - `onEnd` Function

Start handling element dragging behavior

### Editor.UI.cancelDrag ()

Cancel dragging element

### Editor.UI.addDragGhost (cursor)

  - `cursor` String - CSS cursor

Add a dragging mask to keep the cursor not changed while dragging

### Editor.UI.removeDragGhost ()

Remove the dragging mask

### Editor.UI.addHitGhost (cursor, zindex, onhit)

  - `cursor` String - CSS cursor
  - `zindex` Number
  - `onhit` Function

Add hit mask

### Editor.UI.removeHitGhost ()

Remove hit mask

### Editor.UI.addLoadingMask (options, onclick)

  - `options` Object
  - `onclick` Function

Add loading mask

### Editor.UI.removeLoadingMask ()

Remove loading mask

### Editor.UI.toHumanText (text)

  - `text` String

Convert a string to human friendly text. For example, `fooBar` will be `Foo bar`

### Editor.UI.camelCase (text)

  - `text` String

Convert a string to camel case text. For example, `foo-bar` will be `fooBar`

### Editor.UI.kebabCase (text)

  - `text` String

Convert a string to kebab case text. For example, `fooBar` will be `foo-bar`
