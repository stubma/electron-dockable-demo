'use strict';

suite(tap, 'focus-mgr', {timeout: 2000}, t => {
  t.beforeEach(done => {
    Editor.Window.center();
    done();
  });

  t.afterEach(done => {
    helper.reset();
    done();
  });

  t.test('_getFocusableParent', t => {
    helper.runElement(
      'editor-framework://test/fixtures/focus-mgr.html',
      'nested-shadow-dom',
      '#wrapper',
      el => {
        let div = document.createElement('div');
        div.id = 'parent';
        div.focusable = true;
        let shadow = div.createShadowRoot();

        let child = document.createElement('div');
        child.id = 'child';
        child.focusable = true;
        shadow.appendChild(child);

        el.appendChild(div);
        let childEL = child;
        let parent = Editor.UI._FocusMgr._getFocusableParent(childEL);

        t.assert(parent, 'parent must exists');
        t.equal(parent.id, 'parent');

        t.end();
      });
  });

  suite(t, '_getFirstFocusableFrom', t => {
    t.afterEach(done => {
      helper.reset();
      done();
    });

    t.test('get-focusable-from-01', t => {
      helper.runElement(
        'editor-framework://test/fixtures/focus-mgr.html',
        'get-focusable-from-01',
        '#g-0',
        targetEL => {
          let el = targetEL.querySelector('[focusable]');
          if ( el ) {
            el.focusable = true;
          }

          let resultEL = Editor.UI._FocusMgr._getFirstFocusableFrom(targetEL);
          t.equal(resultEL.id, 'g-00100');

          t.end();
        });
    });

    t.test('get-focusable-from-02', t => {
      helper.runElement(
        'editor-framework://test/fixtures/focus-mgr.html',
        'get-focusable-from-02',
        '#g-0',
        targetEL => {
          let el = targetEL.querySelector('[focusable]');
          if ( el ) {
            el.focusable = true;
          }

          let resultEL = Editor.UI._FocusMgr._getFirstFocusableFrom(targetEL);
          t.equal(resultEL.id, 'g-002');

          t.end ();
        });
    });

    t.test('get-focusable-from-03', t => {
      helper.runElement(
        'editor-framework://test/fixtures/focus-mgr.html',
        'get-focusable-from-03',
        '#g-0',
        targetEL => {
          let el = targetEL.querySelector('[focusable]');
          if ( el ) {
            el.focusable = true;
          }

          let resultEL = Editor.UI._FocusMgr._getFirstFocusableFrom(targetEL);
          t.equal(resultEL, null);

          t.end ();
        });
    });
  });
});
