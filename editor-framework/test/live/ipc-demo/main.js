'use strict';

suite(tap, 'ipc', t => {
  let ipc = new Editor.IpcListener();

  t.afterEach(done => {
    ipc.clear();
    done();
  });

  t.test('demo', () => {
    ipc.on ('foobar:say-hello', ( event ) => {
      event.reply (null, {
        foo: 'foo',
        bar: 'bar',
        foobar: 'foobar',
      });
    });

    let win = new Editor.Window();
    win.load('editor-framework://test/live/ipc-demo/index.html');
  });
});
