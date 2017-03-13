'use strict';

const Electron = require('electron');
const ipcRenderer = Electron.ipcRenderer;

// ==========================
// exports
// ==========================

/**
 * @module Editor.Dialog
 */

let Dialog = {
  /**
   * @method openFile
   * @param {...} [args] - whatever arguments the message needs
   *
   * Send 'dialog:open-file' to the main process
   */
  openFile (...args) {
    return ipcRenderer.sendSync.apply(ipcRenderer, [
      'dialog:open-file', ...args
    ]);
  },

  /**
   * @method saveFile
   * @param {...} [args] - whatever arguments the message needs
   *
   * Send 'dialog:save-file' to the main process
   */
  saveFile (...args) {
    return ipcRenderer.sendSync.apply(ipcRenderer, [
      'dialog:save-file', ...args
    ]);
  },

  /**
   * @method messageBox
   * @param {...} [args] - whatever arguments the message needs
   *
   * Send 'dialog:message-box' to the main process
   */
  messageBox (...args) {
    return ipcRenderer.sendSync.apply(ipcRenderer, [
      'dialog:message-box', ...args
    ]);
  },
};

module.exports = Dialog;
