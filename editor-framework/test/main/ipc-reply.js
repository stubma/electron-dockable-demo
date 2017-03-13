'use strict';

const Electron = require('electron');
const BrowserWindow = Electron.BrowserWindow;

// const Async = require('async');

//
suite(tap, 'ipc-reply', t => {
  helper.runEditor(t, {
    enableIpc: true,
  });

  let ipc = new Editor.IpcListener();

  t.afterEach(done => {
    ipc.clear();
    done();
  });

  suite(t, 'Editor.Ipc.sendToMain', t => {
    t.test('it should send message to main process and recieve a reply when starting a request in renderer process', t => {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2main-reply-simple.html');

      ipc.on('foobar:say-hello', (event, foo, bar) => {
        t.equal(BrowserWindow.fromWebContents(event.sender), win.nativeWin);
        t.equal(foo, 'foo');
        t.equal(bar, 'bar');

        event.reply(null,foo,bar);
      });

      ipc.on('foobar:reply', (event, foo, bar) => {
        t.equal(foo, 'foo');
        t.equal(bar, 'bar');

        win.close();
        t.end();
      });
    });

    t.test('it should send message to main process and recieve a reply when starting a request in main process', t => {
      ipc.on('foobar:say-hello', (event, foo, bar) => {
        t.equal(event.senderType, 'main');
        t.equal(foo, 'foo');
        t.equal(bar, 'bar');
        t.type(event.reply, 'function');

        event.reply( null, foo, bar );
      });

      Editor.Ipc.sendToMain('foobar:say-hello', 'foo', 'bar', ( err, foo, bar ) => {
        t.equal(foo, 'foo');
        t.equal(bar, 'bar');

        t.end();
      });
    });

    t.test('it should work for nested case', t => {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2main-reply-nested.html');

      ipc.on('foobar:say-hello', (event, foo, bar) => {
        t.equal(BrowserWindow.fromWebContents(event.sender), win.nativeWin);
        t.equal(foo, 'foo');
        t.equal(bar, 'bar');

        event.reply(null,foo,bar);
      });

      ipc.on('foobar:say-hello-nested', (event, foo, bar) => {
        t.equal(BrowserWindow.fromWebContents(event.sender), win.nativeWin);
        t.equal(foo, 'foo');
        t.equal(bar, 'bar');

        event.reply(null,foo,bar);
      });

      ipc.on('foobar:reply', (event, foo, bar) => {
        t.equal(foo, 'foo');
        t.equal(bar, 'bar');

        win.close();

        t.end();
      });
    });

    t.test('it should close the session when timeout in renderer process', t => {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2main-reply-simple-timeout.html');

      ipc.on('foobar:say-hello', (event, foo, bar) => {
        setTimeout(() => {
          event.reply(null,foo,bar);
        }, 300);
      });

      ipc.on('foobar:error', () => {
        t.error(new Error(), 'this function should not be called');
      });

      ipc.on('foobar:timeout', () => {
        win.close();
        t.end();
      });
    });

    t.test('it should not reply the renderer process when renderer window has been destroyed', t => {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2main-reply-simple.html');

      ipc.on('foobar:say-hello', (event, foo, bar) => {
        win.close();

        setTimeout(() => {
          event.reply(null,foo,bar);
          t.end();
        }, 100);
      });

      ipc.on('foobar:reply', () => {
        t.error(new Error(), 'this function should not be called');
      });
    });

    t.test('it should close the session when timeout in main process', t => {
      ipc.on('foobar:say-hello', (event, foo, bar) => {
        setTimeout(() => {
          event.reply(null,foo,bar);
        }, 300);
      });

      ipc.on('foobar:timeout', () => {
        t.end();
      });

      ipc.on('foobar:error', () => {
        t.error(new Error(), 'this function should not be called');
      });

      Editor.Ipc.sendToMain('foobar:say-hello', 'foo', 'bar', (err) => {
        if ( err.code === 'ETIMEOUT' ) {
          Editor.Ipc.sendToMain('foobar:timeout');
          return;
        }

        Editor.Ipc.sendToMain('foobar:error');
      }, 200);
    });
  });

  suite(t, 'Editor.Window.send', t => {
    t.test('it should send message to renderer process and recieve a reply when starting a request in main process', t => {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/sendreq2win-simple.html');

      win.nativeWin.webContents.on('dom-ready', () => {
        win.send('foobar:say-hello', 'foo', 'bar', (err,foo,bar) => {
          t.equal(foo, 'foo');
          t.equal(bar, 'bar');

          win.close();
          t.end();
        });
      });
    });

    t.test('it should work for nested case', t => {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/sendreq2win-nested.html');

      win.nativeWin.webContents.on('dom-ready', () => {
        win.send('foobar:say-hello', 'foo', 'bar', (err,foo,bar) => {
          win.send('foobar:say-hello-nested', foo, bar, (err,foo,bar) => {
            t.equal(foo, 'foo');
            t.equal(bar, 'bar');

            win.close();
            t.end();
          });
        });
      });
    });

    t.test('it should close the session when timeout', t => {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/sendreq2win-simple-timeout.html');

      win.nativeWin.webContents.on('dom-ready', () => {
        win.send('foobar:say-hello', 'foo', 'bar', (err) => {
          t.assert(err.code, 'ETIMEOUT');
          t.assert(err.ipc, 'foobar:say-hello');
        }, 200);

        setTimeout(() => {
          win.close();
          t.end();
        }, 400);
      });
    });
  });
});
