'use strict';

suite(tap, '<ui-input>', {timeout: 2000}, t => {
  function _newElement ( cb ) {
    helper.runElement(
      'editor-framework://test/fixtures/input.html', 'simple', '#element', cb
    );
  }

  t.beforeEach(done => {
    Editor.Window.center();
    done();
  });

  t.afterEach(done => {
    helper.reset();
    done();
  });

  t.test('it should have shadow root', t => {
    _newElement(el => {
      t.assert(el.shadowRoot);
      t.end();
    });
  });

  t.test('it should focus on element when left mouse down', t => {
    _newElement(el => {
      helper.mousedown( el, 'left' );

      setTimeout(() => {
        t.equal(el.focused, true);
        t.end();
      }, 1);
    });
  });

  t.test('it should get "Foobar" from value property', t => {
    _newElement(el => {
      t.equal(el.value, 'Foobar');
      t.end();
    });
  });

  t.test('it should send "cancel" when type some text and press down "esc" key on the element', t => {
    _newElement(el => {
      el.addEventListener('cancel', event => {
        t.equal(event.detail.value, 'Foobar');
        t.equal(el.$input.value, 'Foobar');
        t.end();
      });

      helper.click( el, 'left' );
      helper.type('a');
      helper.type('b');
      helper.type('c');

      setTimeout(() => {
        helper.keydown('esc');
      }, 10);
    });
  });

  t.test('it should not send "cancel" when value not changed and press down "esc" key on the element', t => {
    _newElement(el => {
      el.addEventListener('cancel', () => {
        t.assert(false, 'should not recieve cancel event');
      });

      helper.click( el, 'left' );
      setTimeout(() => {
        helper.keydown('esc');
        setTimeout(() => {
          t.end();
        }, 100);
      }, 10);
    });
  });

  t.test('it should send "confirm" when type some text and press down "enter" key on the element', t => {
    _newElement(el => {
      el.addEventListener('confirm', () => {
        t.equal(event.detail.value, 'abc');
        t.end();
      });

      helper.click( el, 'left' );
      helper.type('a');
      helper.type('b');
      helper.type('c');

      setTimeout(() => {
        helper.keydown('enter' );
      }, 10);
    });
  });

  t.test('it should not send "confirm" when value not changed and press down "enter" key on the element', t => {
    _newElement(el => {
      el.addEventListener('confirm', () => {
        t.assert(false, 'should not recieve confirm event');
      });

      helper.click( el, 'left' );
      setTimeout(() => {
        helper.keydown('enter' );
        setTimeout(() => {
          t.end();
        }, 100);
      }, 10);
    });
  });

  t.test('it should send "confirm" when type some text, delete it and type the original value, then press down "enter" key on the element', t => {
    _newElement(el => {
      el.addEventListener('confirm', () => {
        t.equal(event.detail.value, 'Foobar');
        t.end();
      });

      helper.click( el, 'left' );
      helper.type('a');
      helper.type('b');
      helper.type('c');
      helper.type('backspace');
      helper.type('backspace');
      helper.type('backspace');
      helper.type('F');
      helper.type('o');
      helper.type('o');
      helper.type('b');
      helper.type('a');
      helper.type('r');

      setTimeout(() => {
        helper.keydown('enter' );
      }, 10);
    });
  });

  t.test('it should directly change the text to "abc" when you click the element and type "abc"', t => {
    _newElement(el => {
      helper.click( el, 'left' );
      helper.type('a');
      helper.type('b');
      helper.type('c');

      setTimeout(() => {
        t.equal(el.value, 'abc');
        t.end();
      }, 10);
    });
  });
});
