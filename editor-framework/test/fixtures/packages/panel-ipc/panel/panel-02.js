Editor.Panel.extend({
  template: `
    This is panel 02
  `,

  messages: {
    'panel-02:simple-reply' ( event, foo, bar ) {
      event.reply(null, foo, bar);
    }
  }
});
