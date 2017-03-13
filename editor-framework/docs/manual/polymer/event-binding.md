# Binding Events

## Register Listener

One way for to bind events is to register an event listener in the Polymer constructor:

```html
<template>
  <div>I will respond</div>
  <div>to a tap on</div>
  <div>any of my children!</div>
  <div id="special">I am special!</div>
</template>
<script>
Polymer({
  is: 'x-custom',
  listeners: {
    'tap': 'regularTap',
    'special.tap': 'specialTap'
  },
  regularTap: function(e) {
    alert("Thank you for tapping");
  },
  specialTap: function(e) {
    alert("It was special tapping");
  }
 })
 </script>
```

Here, we registered an event listener for the current template in `listeners` property. Please notice you can use `nodeId.eventName` pattern to specify the listener for a certain element.

## DOM Attributes

To add event listener to your element in editor web page, use the `on-event` attribute in the element's DOM:

```html
<dom-module id="simple-tag">
  <template>
    <h1 on-click="changeText">Click on this text!</h1>
  </template>
<dom-module>
<script>
  Polymer({
    is: 'simple-tag',
    changeText: function ( event ) {
      el.innerHTML = "Ooops!";
    }
  })
</script>
```

The above example binds an `on-click` event to an `h1` element. And calls `changeText` function when event fires.

Please notice the traditional `onclick=` pattern for DOM event binding will not work with methods defined in `Polymer()` constructor.

## Learn More About Polymer Event Binding

- [Event Listener](https://www.polymer-project.org/1.0/docs/devguide/events.html#event-listeners)
- [Annotated Event Listener](https://www.polymer-project.org/1.0/docs/devguide/events.html#annotated-listeners)
- [Gestures](https://www.polymer-project.org/1.0/docs/devguide/events.html#gestures)
