'use strict';

suite(tap, '<ui-slider>', {timeout: 2000}, t => {
  function _newElement ( cb ) {
    helper.runElement(
      'editor-framework://test/fixtures/slider.html', 'simple', '#element', cb
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

  // it('should focus on element when left mouse down', done => {
  //   _newElement(el => {
  //     helper.mousedown( el, 'left' );

  //     setTimeout(() => {
  //       expect(el.focused).to.equal(true);
  //       helper.keydown( 'esc' );
  //       done();
  //     }, 1);
  //   });
  // });
});
