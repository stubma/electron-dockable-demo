module.exports = {
  load: function () {
  },

  unload: function () {
  },

  'demo-layout:reset': function () {
    var Fs = require('fs');
    var layoutInfo = JSON.parse(Fs.readFileSync(Editor.url('packages://demo-layout/layout.json') ));
    Editor.Ipc.sendToMainWin( 'editor:reset-layout', layoutInfo);
  },
};
