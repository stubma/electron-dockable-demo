# Setting Focusable Behavior

Focusable behavior allow the element manage its focus behavior by focus-manager.

## Initialize

You need to add `Editor.UI.Focusable` to the behaviors list to enable it. After that,
add `_initFocusable` in your `ready` callback.

```javascript
Editor.UI.registerElement('ui-foobar', {
  behaviors: [ Editor.UI.Focusable ],

  ready () {
    this._initFocusable(this);
  }
});
```

## initFocusable( focusELs, navELs )

There are two parameters can be sent in `_initFocusable` function. The first parameter
tells focusable behaviors which element or element list should I treat as focus element.
The second parameter tells focusable behaviors, if user use `TAB` key to navigate the
focus, which one should it used by default.

## Working with mousedown event

Sometimes we will focus on child element by default, and we will register `mousedown` event
in the root and force it focus on child. To accomplish this, we need to call `preventDefault`
to prevent the browser default focus behavior which will triggered by mouse down on the element.

```javascript
this.addEventListener('mousedown', event => {
  Editor.UI.acceptEvent(event);
  Editor.UI.focus(this);
});
```
