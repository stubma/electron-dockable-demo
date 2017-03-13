'use strict';

suite(tap, '<ui-select>', {timeout: 2000}, t => {
  function _newElement ( cb ) {
    helper.runElement(
      'editor-framework://test/fixtures/select.html', 'simple', '#element', cb
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

  t.test('should have shadow root', t => {
    _newElement(el => {
      t.assert(el.shadowRoot);
      t.end();
    });
  });

  t.test('should focus on element when left mouse down', t => {
    _newElement(el => {
      helper.mousedown( el, 'left' );

      setTimeout(() => {
        t.equal(el.focused, true);
        helper.keydown( 'esc' );
        t.end();
      }, 1);
    });
  });

  t.test('should get "1" from value property', t => {
    _newElement(el => {
      t.equal(el.value, '1');
      t.end();
    });
  });

  t.test('should get "Bar" from selectedText property', t => {
    _newElement(el => {
      t.equal(el.selectedText, 'Bar');
      t.end();
    });
  });
});
