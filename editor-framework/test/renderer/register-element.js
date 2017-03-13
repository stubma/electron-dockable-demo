'use strict';

suite(tap, 'Editor.UI.registerElement', {timeout: 2000}, t => {
  t.test('the return value should be a constructor, and have the correct tagName', t => {
    let UITest = Editor.UI.registerElement('ui-test', {});

    t.type( UITest, 'function' );
    t.equal( UITest.tagName, 'UI-TEST' );
    t.end();
  });

  t.test('the ready should be called', t => {
    let UITest = Editor.UI.registerElement('ui-test-02', {
      ready () {
        t.type(this, HTMLElement);
      },
    });

    let el = new UITest();
    t.type(el, HTMLElement);
    t.type(el, UITest);
    t.end();
  });

  t.test('the factoryImpl should be called', t => {
    let UITest = Editor.UI.registerElement('ui-test-03', {
      factoryImpl ( foo, bar ) {
        t.equal(foo, 'foo');
        t.equal(bar, 'bar');
        t.type(this, HTMLElement);
      },
    });

    let el = new UITest('foo', 'bar');
    t.type(el, HTMLElement);
    t.end();
  });

  t.test('should create the template', t => {
    let UITest = Editor.UI.registerElement('ui-test-04', {
      style: `
        #foo {
          color: #f00;
        }

        #bar {
          color: #0f0;
        }
      `,

      template: `
        <div id="foo">this is foo</div>
        <div id="bar">this is bar</div>
      `,

      $: {
        foo: '#foo',
        bar: '#bar',
      },

      ready () {
        t.equal(this.$foo, this.shadowRoot.querySelector('#foo'));
        t.equal(this.$bar, this.shadowRoot.querySelector('#bar'));
      },
    });

    let el = new UITest();
    document.body.appendChild(el);

    let computedFoo = window.getComputedStyle(el.$foo);
    let computedBar = window.getComputedStyle(el.$bar);
    t.equal(computedFoo.color, 'rgb(255, 0, 0)');
    t.equal(computedBar.color, 'rgb(0, 255, 0)');

    Editor.UI.clear(document.body);
    t.end();
  });
});
