'use strict';

suite(tap, 'simple', t => {
  let ipc = new Editor.IpcListener();

  t.afterEach(done => {
    ipc.clear();
    done();
  });

  t.test('demo', () => {
    const Electron = require('electron');

    Electron.ipcMain.on('foobar:open-panel', () => {
      win.send('foobar:run', 'panel-id', 'some', 'args');
    });

    let win = new Editor.Window();
    win.load('editor-framework://test/live/simple/index.html');


    // win.nativeWin.webContents.on('dom-ready', () => {
    //   Editor.Ipc.sendToWins('foobar:say-hello', 'foo', 'bar');
    // });

    // ipc.on('foobar:reply', (event, foo, bar) => {
    //   expect(foo).to.eql('foo');
    //   expect(bar).to.eql('bar');
    //   // win.close();
    // });
  });
});
