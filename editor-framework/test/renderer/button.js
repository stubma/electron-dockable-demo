'use strict';

suite(tap, '<ui-button>', {timeout: 2000}, t => {
  function _newElement ( cb ) {
    helper.runElement(
      'editor-framework://test/fixtures/button.html', 'simple', '#element', cb
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

  t.test('it should focus on element when left mouse down on the element', t => {
    _newElement(el => {
      helper.mousedown(el, 'left');

      setTimeout(() => {
        t.equal(el.focused, true);
        t.end();
      }, 1);
    });
  });

  t.test('it should send "click" event when left mouse click on the element', t => {
    _newElement(el => {
      el.addEventListener('click', () => {
        t.end();
      });
      helper.click(el, 'left');
    });
  });

  t.test('it should send "click" event when we focus the element and press "space" key', t => {
    _newElement(el => {
      el.addEventListener('click', () => {
        t.end();
      });
      helper.focus(el);
      helper.pressSpace();
    });
  });

  t.test('it should send "click" event when we focus the element and press down "enter" key', t => {
    _newElement(el => {
      el.addEventListener('click', () => {
        t.end();
      });
      helper.focus(el);
      helper.keydown('enter');
    });
  });

  t.test('it should not send "click" event when we press down "space", then focus the element and press up "space" key', t => {
    _newElement(el => {
      el.addEventListener('click', () => {
        t.assert(false, 'should not recieve click event');
      });

      helper.focus(null);
      helper.keydown('space');

      setTimeout(() => {
        helper.focus(el);
        helper.keyup('space');

        setTimeout(() => {
          t.end();
        }, 100);
      },10);
    });
  });

  t.test('it should not send "click" event when left mouse down on the element and left mouse up outside the element', t => {
    _newElement(el => {
      el.addEventListener('click', () => {
        t.assert(false, 'should not recieve click event');
      });

      helper.mousedown(el, 'left');
      setTimeout(() => {
        t.assert(el.getAttribute('pressed') !== null);
        helper.mouseup(document.body, 'left');

        setTimeout(() => {
          t.assert(el.getAttribute('pressed') === null);
          t.end();
        }, 100);
      }, 10);
    });
  });

  t.test('should send "confirm" event when the element clicked', t => {
    _newElement(el => {
      el.addEventListener('confirm', () => {
        t.end();
      });
      helper.click( el, 'left' );
    });
  });

  t.test('should send "cancel" event when we press "esc" on a pressed element', t => {
    _newElement(el => {
      el.addEventListener('cancel', () => {
        t.end();
      });

      helper.focus(el);
      helper.keydown('space');
      helper.keydown('esc');
    });
  });
});
