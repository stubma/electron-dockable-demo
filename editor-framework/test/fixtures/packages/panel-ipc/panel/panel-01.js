Editor.Panel.extend({
  template: `
    This is panel 01
  `,

  messages: {
    'panel-01:simple' ( event, foo, bar ) {
      event.sender.send('panel-01:reply', foo, bar);
    }
  }
});
