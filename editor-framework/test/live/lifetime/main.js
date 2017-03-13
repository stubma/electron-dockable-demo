'use strict';

suite(tap, 'lifetime', t => {
  let ipc = new Editor.IpcListener();

  t.afterEach(done => {
    ipc.clear();
    done();
  });

  t.test('demo', () => {
    let win = new Editor.Window('main');
    let events = [
      'did-start-loading',
      'did-stop-loading',
      'did-finish-load',
      'did-frame-finish-load',
      'dom-ready',
      // 'destroyed',
    ];

    events.forEach(name => {
      win.nativeWin.webContents.on(name, () => {
        Editor.info(name);
      });
    });

    win.load('editor-framework://test/live/lifetime/index.html');
  });
});
