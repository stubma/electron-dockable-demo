'use strict';

suite(tap, '<ui-dock-resizer>', t => {
  suite(t, '<ui-dock-resizer> horizontal', t => {
    let totalSize = 480 - Editor.UI.DockUtils.resizerSpace * 2;
    let targetEL;

    t.beforeEach(done => {
      helper.runElement(
        'editor-framework://test/fixtures/resizer.html', 'horizontal', '#container',
        el => {
          targetEL = el;

          Editor.Window.resizeSync( 500, 200, true );
          Editor.Window.center();

          setTimeout(() => {
            targetEL._finalizeSizeRecursively(true);
            targetEL._finalizeMinMaxRecursively();
            targetEL._finalizeStyleRecursively();

            done();
          }, 100);
        }
      );
    });

    t.afterEach(done => {
      targetEL.remove();
      targetEL = null;

      done();
    });

    t.test('should layout the elements in same size', t => {
      let size = totalSize/3;
      size = Math.round(size);

      t.equal(targetEL.querySelector('#box1').offsetWidth, size);
      t.equal(targetEL.querySelector('#box2').offsetWidth, size);
      t.equal(targetEL.querySelector('#box3').offsetWidth, size);

      t.end();
    });

    t.test('should continue resize the next element if the first element reach the min-width', t => {
      let resizer = targetEL.querySelector('ui-dock-resizer');
      let rect = resizer.getBoundingClientRect();

      helper.mousetrack(resizer, 'left', 1000,
        `M${rect.left},${rect.top+50}
         L${rect.left+400},${rect.top+50}
         `,
        () => {
          t.equal(targetEL.querySelector('#box1').offsetWidth, totalSize-100-100);
          t.equal(targetEL.querySelector('#box2').offsetWidth, 100);
          t.equal(targetEL.querySelector('#box3').offsetWidth, 100);

          t.end();
        }
      );
    });

    t.test('should not resize the last element when we resize in the reverse direction', t => {
      let resizer = targetEL.querySelector('ui-dock-resizer');
      let rect = resizer.getBoundingClientRect();

      helper.mousetrack(resizer, 'left', 1000,
        `M${rect.left},${rect.top+50}
         L${rect.left+400},${rect.top+50}
         L${rect.left-400},${rect.top+50}
         `,
        () => {
          t.equal(targetEL.querySelector('#box1').offsetWidth, 100);
          t.equal(targetEL.querySelector('#box2').offsetWidth, totalSize-100-100);
          t.equal(targetEL.querySelector('#box3').offsetWidth, 100);

          t.end();
        }
      );
    });
  });

  suite(t, '<ui-dock-resizer> vertical', t => {
    let totalSize = 480 - Editor.UI.DockUtils.resizerSpace * 2;
    let targetEL;

    t.beforeEach(done => {
      helper.runElement(
        'editor-framework://test/fixtures/resizer.html', 'vertical', '#container',
        el => {
          targetEL = el;

          Editor.Window.resizeSync( 200, 500, true );
          Editor.Window.center();

          setTimeout(() => {
            targetEL._finalizeSizeRecursively(true);
            targetEL._finalizeMinMaxRecursively();
            targetEL._finalizeStyleRecursively();

            done();
          }, 100);
        }
      );
    });

    t.afterEach(done => {
      targetEL.remove();
      targetEL = null;

      done();
    });

    t.test('should layout the elements in same size', t => {
      let size = totalSize/3;
      size = Math.round(size);

      t.equal(targetEL.querySelector('#box1').offsetHeight, size);
      t.equal(targetEL.querySelector('#box2').offsetHeight, size);
      t.equal(targetEL.querySelector('#box3').offsetHeight, size);

      t.end();
    });

    t.test('should continue resize the next element if the first element reach the min-width', t => {
      let resizer = targetEL.querySelector('ui-dock-resizer');
      let rect = resizer.getBoundingClientRect();

      helper.mousetrack(resizer, 'left', 1000,
        `M${rect.left+50},${rect.top}
         L${rect.left+50},${rect.top+400}
         `,
        () => {
          t.equal(targetEL.querySelector('#box1').offsetHeight, totalSize-100-100);
          t.equal(targetEL.querySelector('#box2').offsetHeight, 100);
          t.equal(targetEL.querySelector('#box3').offsetHeight, 100);

          t.end();
        }
      );
    });

    t.test('should not resize the last element when we resize in the reverse direction', t => {
      let resizer = targetEL.querySelector('ui-dock-resizer');
      let rect = resizer.getBoundingClientRect();

      helper.mousetrack(resizer, 'left', 1000,
        `M${rect.left+50},${rect.top}
         L${rect.left+50},${rect.top+400}
         L${rect.left+50},${rect.top-400}
         `,
        () => {
          t.equal(targetEL.querySelector('#box1').offsetHeight, 100);
          t.equal(targetEL.querySelector('#box2').offsetHeight, totalSize-100-100);
          t.equal(targetEL.querySelector('#box3').offsetHeight, 100);

          t.end();
        }
      );
    });
  });
});
