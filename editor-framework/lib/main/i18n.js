'use strict';

const i18n = require('../share/i18n');
module.exports = i18n;

const Electron = require('electron');

Electron.ipcMain.on('editor:get-i18n-phrases', event => {
  event.returnValue = i18n.polyglot.phrases;
});
