# Writing Tests

## Writing Tests for an App

**Main Process**

```js
suite(tap, 'Test Main Process', t => {
  t.test ('should be ok', t => {
    t.end();
  });
});
```

**Renderer Process**

```html
<template id="basic">
  <div class="title">Hello World</div>
</template>
```

```js
suite(tap, 'Test Renderer Process', t => {
  t.test('should be ok', t => {
    helper.runElement(
      'app://test/my-template.html', 'basic', 'div.title',
      el => {
        t.assert(el, 'element not found');
        t.equal(el.innertText, 'Hello World');

        t.end();
      }
    );
  });
});
```

## Writing Tests for a Package

TODO
