'use strict';

const Fs = require('fire-fs');
const Path = require('fire-path');

// const Async = require('async');

//
suite(tap, 'ipc-panel', t => {
  const testPackages = Editor.url('editor-framework://test/fixtures/packages/');

  helper.runEditor(t, {
    enableIpc: true,
  });

  let ipc = new Editor.IpcListener();

  t.afterEach(done => {
    ipc.clear();

    done();
  });

  suite(t, 'Init', t => {
    // FIXME: after Electron 1.2.5, protocol will be failed if I don't run this code by default
    let win = new Editor.Window();
    win.load('editor-framework://static/blank.html');
    win.nativeWin.webContents.on('dom-ready', () => {
      win.close();
      t.end();
    });
  });

  suite(t, 'Editor.Ipc.sendToPanel', t => {
    t.test('it should send message to panel from main process', {timeout: 5000}, t => {
      const path = Path.join(testPackages,'panel-ipc');
      t.ok( Fs.existsSync(path) );

      ipc.on('panel-01:reply', ( event, foo, bar ) => {
        t.equal(foo, 'foo');
        t.equal(bar, 'bar');

        Editor.Panel.close('panel-ipc');
        t.end();
      });

      Editor.Package.load(path, () => {
        Editor.Panel.open('panel-ipc');

        let win = Editor.Panel.findWindow('panel-ipc');
        win.nativeWin.webContents.on('dom-ready', () => {
          // TODO: Panel.open should have callback
          setTimeout(() => {
            Editor.Ipc.sendToPanel('panel-ipc', 'panel-01:simple', 'foo', 'bar');
          }, 500);
        });
      });
    });

    t.test('it should send message to panel and recieve reply from main process', {timeout: 5000}, t => {
      const path = Path.join(testPackages,'panel-ipc');
      t.ok( Fs.existsSync(path) );

      Editor.Package.load(path, () => {
        Editor.Panel.open('panel-ipc-02');

        let win = Editor.Panel.findWindow('panel-ipc-02');
        win.nativeWin.webContents.on('dom-ready', () => {
          // TODO: Panel.open should have callback
          setTimeout(() => {
            Editor.Ipc.sendToPanel('panel-ipc-02', 'panel-02:simple-reply', 'foo', 'bar', (err, foo, bar) => {
              t.equal(foo, 'foo');
              t.equal(bar, 'bar');

              Editor.Panel.close('panel-ipc-02');
              t.end();
            });
          }, 500);
        });
      });
    });

    // t.test('it should send message to panel and recieve reply from renderer process', t => {
    //   const path = Path.join(testPackages,'panel-ipc');
    //   assert.isTrue( Fs.existsSync(path) );

    //   Editor.Package.load(path, () => {
    //     Editor.Panel.open('panel-ipc-02');
    //     Editor.Panel.open('panel-ipc-03');

    //     // TODO: Panel.open should have callback
    //     setTimeout(() => {
    //       ipc.on('panel-03:reply', ( event, foo, bar ) => {
    //         t.equal(foo, 'foo');
    //         t.equal(bar, 'bar');

    //         t.end();
    //       });
    //     }, 500);
    //   });
    // });
  });
});
