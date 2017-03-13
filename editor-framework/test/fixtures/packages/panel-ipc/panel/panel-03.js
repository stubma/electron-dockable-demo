Editor.Panel.extend({
  template: `
    This is panel 03
  `,

  ready () {
    setTimeout( () => {
      Editor.Ipc.sendToPanel('panel-ipc-02', 'panel-02:simple-reply', 'foo', 'bar', (err, foo, bar) => {
        Editor.Ipc.sendToMain('panel-03:reply', foo, bar);
      });
    }, 500);
  }
});
