'use strict';

const Electron = require('electron');
const i18n = require('../share/i18n');

let phrases = Electron.ipcRenderer.sendSync('editor:get-i18n-phrases');
i18n.polyglot.extend(phrases);

module.exports = i18n;
