'use strict';

const Electron = require('electron');
const Fs = require('fire-fs');
const Url = require('fire-url');
const _ = require('lodash');

const Console = require('./console');
const Protocol = require('./protocol');
const IpcListener = require('../share/ipc-listener');

const BrowserWindow = Electron.BrowserWindow;

// ========================================
// exports
// ========================================

/**
 * @module Editor
 */

/**
 * @class Worker
 * @constructor
 * @param {string} name - The worker name
 * @param {object} options
 * @param {string} options.workerType - Can be one of the list:
 *  - `renderer`: Indicate the worker is running in a hidden window
 *  - `main`: Indicate the worker is running is a process
 * @param {string} options.url - The url of renderer worker.
 *
 * Worker class for operating worker
 */

class Worker {
  constructor ( name, options ) {
    this.options = options || {};
    this.ipcListener = new IpcListener();

    _.defaultsDeep(options, {
      workerType: 'renderer',
      url: '',
    });
  }

  /**
   * @method start
   * @param {object} argv
   * @param {function} cb
   *
   * Starts the worker
   */
  start ( argv, cb ) {
    if ( typeof argv === 'function' ) {
      cb = argv;
      argv = undefined;
    }

    if ( this.options.workerType === 'renderer' ) {
      this.nativeWin = new BrowserWindow({
        width: 0,
        height: 0,
        show: false,
      });

      this.nativeWin.on('closed', () => {
        this.ipcListener.clear();
        this.dispose();
      });

      this.nativeWin.webContents.on('dom-ready', () => {
        if ( cb ) {
          cb ();
        }
      });

      this._load( this.options.url, argv );
    }
  }

  /**
   * @method close
   *
   * Close the worker
   */
  close () {
    if ( this.options.workerType === 'renderer' ) {
      this.nativeWin.close();
    }
  }

  /**
   * @method on
   * @param {string} message
   * @param {...} args
   *
   * Listen to the ipc mesage come from renderer
   */
  on (...args) {
    if ( this.options.workerType === 'renderer' ) {
      this.ipcListener.on.apply(this.ipcListener, args);
    }
  }

  /**
   * @method dispose
   *
   * Dereference the native window.
   */
  dispose () {
    // NOTE: Important to dereference the window object to allow for GC
    this.nativeWin = null;
  }

  _load ( editorUrl, argv ) {
    let resultUrl = Protocol.url(editorUrl);
    if ( !resultUrl ) {
      Console.error( `Failed to load page ${editorUrl} for window "${this.name}"` );
      return;
    }

    this._loaded = false;
    let argvHash = argv ? encodeURIComponent(JSON.stringify(argv)) : undefined;
    let url = resultUrl;

    // if this is an exists local file
    if ( Fs.existsSync(resultUrl) ) {
      url = Url.format({
        protocol: 'file',
        pathname: resultUrl,
        slashes: true,
        hash: argvHash
      });
      this._url = url;
      this.nativeWin.loadURL(url);

      return;
    }

    // otherwise we treat it as a normal url
    if ( argvHash ) {
      url = `${resultUrl}#${argvHash}`;
    }
    this._url = url;
    this.nativeWin.loadURL(url);
  }
}

module.exports = Worker;
