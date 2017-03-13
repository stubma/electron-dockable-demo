'use strict';

suite(tap, 'helper', {timeout: 2000}, t => {
  function _newElement (cb) {
    let el = document.createElement('div');
    el.classList.add('layout');
    el.classList.add('fit');
    el.tabIndex = -1;

    document.body.appendChild(el);
    cb(el);
  }

  t.test('it should respond keydown "a"', t => {
    _newElement(el => {
      el.focus();
      el.addEventListener('keydown', event => {
        t.equal(event.keyCode, Editor.KeyCode('a'));

        el.remove();
        t.end();
      });

      helper.keydown('a');
    });
  });

  t.test('it should respond "command + t"', t => {
    _newElement(el => {
      el.focus();
      el.addEventListener('keydown', event => {
        t.assert(event.metaKey);
        t.equal(event.keyCode, Editor.KeyCode('t'));

        el.remove();
        t.end();
      });

      helper.keydown('t', ['command'] );
    });
  });

  t.test('it should respond keyup "b"', t => {
    _newElement(el => {
      el.focus();
      el.addEventListener('keyup', event => {
        t.equal(event.keyCode, Editor.KeyCode('b'));

        el.remove();
        t.end();
      });

      helper.keyup('b');
    });
  });

  t.test('it should respond click', t => {
    _newElement(el => {
      el.addEventListener( 'click', event => {
        t.equal(event.which, 1);

        el.remove();
        t.end();
      });

      helper.click( el );
    });
  });

  t.test('it should respond mousedown on right button', t => {
    _newElement(el => {
      el.addEventListener('mousedown', event => {
        t.equal(event.which, 3);

        el.remove();
        t.end();
      });

      helper.mousedown( el, 'right' );
    });
  });

  t.test('it should respond mouseup on left button', t => {
    _newElement(el => {
      el.addEventListener( 'mouseup', event => {
        t.equal(event.which, 1);

        el.remove();
        t.end();
      });

      helper.mouseup( el, 'left' );
    });
  });

  t.test('it should respond dblclick on left button', t => {
    _newElement(el => {
      el.addEventListener( 'dblclick', event => {
        t.equal(event.which, 1);

        el.remove();
        t.end();
      });

      helper.dblclick( el, 'left' );
    });
  });

  t.test('it should respond mousewheel', t => {
    _newElement(el => {
      el.addEventListener( 'mousewheel', event => {
        t.equal(event.deltaY, 10);

        el.remove();
        t.end();
      });

      helper.mousewheel( el, null, 10 );
    });
  });

  t.test('it should respond mousemove', {timeout: 0}, t => {
    _newElement(el => {
      helper.mousemove(
        el,
        'left',
        1000,
        `M0,0, L100,100, C100,0, 200,0, 200,100`,
        () => {
          el.remove();
          t.end();
        }
      );
    });
  });

  t.test('it should respond mousemove step', {timeout: 0}, t => {
    _newElement(el => {
      // reset the mouse to 0,0
      helper.mousemove(el, 'left', 100, `M0,0, 0,0`, () => {
        let results = [
          { x: 0, y: 0 },
          { x: 20, y: 20 },
          { x: 40, y: 40 },
          { x: 60, y: 60 },
          { x: 80, y: 80 },
          { x: 100, y: 100 },
        ];
        let idx = 0;

        el.addEventListener('mousemove', event => {
          t.equal(event.clientX, results[idx].x, `idx = ${idx}`);
          t.equal(event.clientY, results[idx].y, `idx = ${idx}`);
          idx += 1;

          if ( idx === results.length ) {
            el.remove();
            t.end();

            return;
          }
        });

        helper.mousemoveStep( el, 'left', 5, `M0,0, L100,100` );
      });
    });
  });
});
