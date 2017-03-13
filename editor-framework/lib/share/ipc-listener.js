'use strict';

const Electron = require('electron');
const Platform = require('./platform');

let _ipc = null;
if ( Platform.isMainProcess ) {
  _ipc = Electron.ipcMain;
} else {
  _ipc = Electron.ipcRenderer;
}

// ==========================
// exports
// ==========================

/**
 * @class Editor.IpcListener
 */

class IpcListener {
  /**
   * @constructor
   *
   * Class for easily manage IPC events
   */
  constructor () {
    this.listeningIpcs = [];
  }

  /**
   * @method on
   * @param {string} message
   * @param {function} callback
   *
   * Register IPC message and respond it with the callback function
   */
  on (message, callback) {
    _ipc.on( message, callback );
    this.listeningIpcs.push( [message, callback] );
  }

  /**
   * @method once
   * @param {string} message
   * @param {function} callback
   *
   * Register IPC message and respond it once with the callback function
   */
  once (message, callback) {
    _ipc.once( message, callback );
    this.listeningIpcs.push( [message, callback] );
  }

  /**
   * @method clear
   *
   * Clear all registered IPC messages in the listener.
   */
  clear () {
    for (let i = 0; i < this.listeningIpcs.length; i++) {
      let pair = this.listeningIpcs[i];
      _ipc.removeListener( pair[0], pair[1] );
    }
    this.listeningIpcs.length = 0;
  }
}

module.exports = IpcListener;
