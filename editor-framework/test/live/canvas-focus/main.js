'use strict';

suite(tap, 'canvas-focus', t => {
  t.test('demo', () => {
    let win = new Editor.Window();
    win.load('editor-framework://test/live/canvas-focus/index.html');

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
