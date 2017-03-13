'use strict';

const Electron = require('electron');
const Url = require('fire-url');
const Fs = require('fire-fs');
const _ = require('lodash');
const EventEmitter = require('events');

const BrowserWindow = Electron.BrowserWindow;

let _windows = [];
let _windowLayouts = {};
let _defaultLayout = '';
let _mainwin = null;

// ========================================
// exports
// ========================================

/**
 * @module Editor
 */

/**
 * @class Window
 * @extends EventEmitter
 * @constructor
 * @param {string} name - The window name
 * @param {object} options - The options use [Electron's BrowserWindow options](http://electron.atom.io/docs/api/browser-window/#new-browserwindowoptions)
 * with the following additional field:
 * @param {string} options.windowType - Can be one of the list:
 *  - `dockable`: Indicate the window contains a dockable panel
 *  - `float`: Indicate the window is standalone, and float on top.
 *  - `fixed-size`: Indicate the window is standalone, float on top and non-resizable.
 *  - `quick`: Indicate the window will never destroyed, it only hides itself when it close which make it quick to show the next time.
 * @param {boolean} options.save - Indicate if save the window position and size
 * @param {boolean} options.disableDevTools - Indicate if disable devtools for the window
 *
 * Window class for operating editor window.
 */
class Window extends EventEmitter {
  constructor ( name, options ) {
    super();
    options = options || {};

    // set default value for options
    _.defaultsDeep(options, {
      disableDevTools: false,
      windowType: 'dockable',
      width: 400,
      height: 300,
      acceptFirstMouse: true, // NOTE: this will allow mouse click works when window is not focused
      disableAutoHideCursor: true, // NOTE: this will prevent hide cursor when press "space"
      // titleBarStyle: 'hidden', // TODO
      backgroundColor: '#333',
      webPreferences: {
        preload: Protocol.url('editor-framework://renderer.js'),
        // defaultFontFamily: {
        //   standard: 'Helvetica Neue',
        //   serif: 'Helvetica Neue',
        //   sansSerif: 'Helvetica Neue',
        //   monospace: 'Helvetica Neue',
        // },
      },
      defaultFontSize: 13,
      defaultMonospaceFontSize: 13,
    });

    this._loaded = false;
    this._currentSessions = {};

    // init options
    this.name = name;
    this.disableDevTools = options.disableDevTools;
    this.hideWhenBlur = false; // control by options.hideWhenBlur or winType === 'quick';
    this.windowType = options.windowType;
    this.save = options.save;

    if ( typeof this.save !== 'boolean' ) {
      this.save = true;
    }

    switch ( this.windowType ) {
      case 'dockable':
        options.resizable = true;
        options.alwaysOnTop = false;
        break;

      case 'float':
        options.resizable = true;
        options.alwaysOnTop = true;
        break;

      case 'fixed-size':
        options.resizable = false;
        options.alwaysOnTop = true;
        break;

      case 'quick':
        options.resizable = true;
        options.alwaysOnTop = true;
        this.hideWhenBlur = true;
        break;
    }

    this.nativeWin = new BrowserWindow(options);

    if ( this.hideWhenBlur ) {
      this.nativeWin.setAlwaysOnTop(true);
    }

    // ======================
    // BrowserWindow events
    // ======================

    this.nativeWin.on('focus', () => {
      if ( !App.focused ) {
        App.focused = true;
        App.emit('focus');
      }
    });

    this.nativeWin.on('blur', () => {
      // BUG: this is an atom-shell bug,
      //      it cannot get focused window at the same frame
      // https://github.com/atom/atom-shell/issues/984
      setImmediate(() => {
        if ( !BrowserWindow.getFocusedWindow() ) {
          App.focused = false;
          App.emit('blur');
        }
      });

      if ( this.hideWhenBlur ) {
        // this.nativeWin.close();
        this.nativeWin.hide();
      }
    });

    this.nativeWin.on('close', event => {
      // quick window never close, it just hide
      if ( this.windowType === 'quick' ) {
        event.preventDefault();
        this.nativeWin.hide();
      }

      // NOTE: I cannot put these in 'closed' event. In Windows, the getBounds will return
      //       zero width and height in 'closed' event
      Panel._onWindowClose(this);
      Window.commitWindowStates();
      Window.saveWindowStates();
    });

    this.nativeWin.on('closed', () => {
      Panel._onWindowClosed(this);

      // if we still have sendRequestToPage callbacks,
      // just call them directly to prevent request endless waiting
      for ( let sessionId in this._currentSessions ) {
        Ipc._closeSessionThroughWin(sessionId);
        let cb = this._currentSessions[sessionId];
        if (cb) {
          cb();
        }
      }
      this._currentSessions = {};

      if ( this.isMainWindow ) {
        Window.removeWindow(this);
        Window.main = null;
        EditorM._quit(); // TODO: change to App._quit()
      } else {
        Window.removeWindow(this);
      }

      this.dispose();
    });

    this.nativeWin.on('unresponsive', event => {
      Console.error( `Window "${this.name}" unresponsive: ${event}` );
    });

    // ======================
    // WebContents events
    // ======================

    // order: dom-ready -> did-frame-finish-load -> did-finish-load

    // this.nativeWin.webContents.on('dom-ready', event => {
    //   Console.log('dom-ready');
    // });

    // this.nativeWin.webContents.on('did-frame-finish-load', () => {
    //   Console.log('did-frame-finish-load');
    // });

    this.nativeWin.webContents.on('did-finish-load', () => {
      this._loaded = true;

      // TODO: do we really need this?
      // Ipc.sendToMain('editor:window-reloaded', this);
    });

    this.nativeWin.webContents.on('crashed', event => {
      Console.error( `Window "${this.name}" crashed: ${event}` );
    });

    this.nativeWin.webContents.on('will-navigate', (event, url) => {
      event.preventDefault();
      Electron.shell.openExternal(url);

      // TODO: can have more protocol for navigate
    });

    // NOTE: window must be add after nativeWin assigned
    Window.addWindow(this);
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

  /**
   * @method load
   * @param {string} url
   * @param {object} argv
   *
   * Load page by url, and send `argv` in query property of the url.
   * The renderer process will parse the `argv` when the page is ready and save it in `Editor.argv` in renderer process.
   */
  load ( editorUrl, argv ) {
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

  /**
   * @method show
   *
   * Show the window
   */
  show () {
    this.nativeWin.show();
  }

  /**
   * @method hide
   *
   * Hide the window
   */
  hide () {
    this.nativeWin.hide();
  }

  /**
   * @method close
   *
   * Close the window
   */
  close () {
    this._loaded = false;
    this.nativeWin.close();
  }

  /**
   * @method forceClose
   *
   * Force close the window
   */
  forceClose () {
    this._loaded = false;

    // NOTE: I cannot put these in 'closed' event. In Windows, the getBounds will return
    //       zero width and height in 'closed' event
    Panel._onWindowClose(this);
    Window.commitWindowStates();
    Window.saveWindowStates();

    if (this.nativeWin) {
      this.nativeWin.destroy();
    }
  }

  /**
   * @method focus
   *
   * Focus on the window
   */
  focus () {
    this.nativeWin.focus();
  }

  /**
   * @method minimize
   *
   * Minimize the window
   */
  minimize () {
    this.nativeWin.minimize();
  }

  /**
   * @method restore
   *
   * Restore the window
   */
  restore () {
    this.nativeWin.restore();
  }

  /**
   * @method openDevTools
   * @param {object} options
   * @param {string} options.mode - Opens the devtools with specified dock state, can be `right`, `bottom`, `undocked`, `detach`.
   * Defaults to last used dock state.
   * In `undocked` mode it’s possible to dock back.
   * In detach mode it’s not.
   *
   * Open the devtools
   */
  openDevTools (options) {
    if (this.disableDevTools) {
      return;
    }

    options  = options || { mode: 'detach' };
    this.nativeWin.openDevTools(options);
  }

  /**
   * @method closeDevTools
   *
   * Closes the devtools
   */
  closeDevTools () {
    this.nativeWin.closeDevTools();
  }

  /**
   * @method adjust
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   *
   * Try to adjust the window to fit the position and size we give
   */
  adjust ( x, y, w, h ) {
    let adjustToCenter = false;

    if ( typeof x !== 'number' ) {
      adjustToCenter = true;
      x = 0;
    }

    if ( typeof y !== 'number' ) {
      adjustToCenter = true;
      y = 0;
    }

    if ( typeof w !== 'number' || w <= 0 ) {
      adjustToCenter = true;
      w = 800;
    }

    if ( typeof h !== 'number' || h <= 0 ) {
      adjustToCenter = true;
      h = 600;
    }

    let display = Electron.screen.getDisplayMatching( { x: x, y: y, width: w, height: h } );
    this.nativeWin.setSize(w,h);
    this.nativeWin.setPosition( display.workArea.x, display.workArea.y );

    if ( adjustToCenter ) {
      this.nativeWin.center();
    } else {
      this.nativeWin.setPosition( x, y );
    }
  }

  /**
   * @method commitWindowState
   * @param {object} layoutInfo
   *
   * Commit the current window state
   */
  commitWindowState ( layoutInfo ) {
    // don't do anything if we do not want to save the window
    if ( !this.save ) {
      return;
    }

    let winBounds = this.nativeWin.getBounds();

    if ( !winBounds.width ) {
      Console.warn(`Failed to commit window state. Invalid window width: ${winBounds.width}`);
      winBounds.width = 800;
    }

    if ( !winBounds.height ) {
      Console.warn(`Failed to commit window state. Invalid window height ${winBounds.height}`);
      winBounds.height = 600;
    }

    // store windows layout
    let winInfo = _windowLayouts[this.name];
    winInfo = Object.assign( winInfo || {}, winBounds);

    if ( layoutInfo ) {
      winInfo.layout = layoutInfo;
    }

    _windowLayouts[this.name] = winInfo;
  }

  /**
   * @method restorePositionAndSize
   *
   * Restore window's position and size from the `local` profile `layout.windows.json`
   */
  restorePositionAndSize () {
    // restore window size and position
    let size = this.nativeWin.getSize();
    let winPosX, winPosY, winSizeX = size[0], winSizeY = size[1];

    let profile = Profile.load('layout.windows', 'local');
    if ( profile.windows && profile.windows[this.name] ) {
      let winInfo = profile.windows[this.name];
      winPosX = winInfo.x;
      winPosY = winInfo.y;
      winSizeX = winInfo.width;
      winSizeY = winInfo.height;
    }
    this.adjust( winPosX, winPosY, winSizeX, winSizeY );
  }

  // ========================================
  // Ipc
  // ========================================

  _send (...args) {
    let webContents = this.nativeWin.webContents;
    if (!webContents) {
      Console.error(`Failed to send "${args[0]}" to ${this.name} because web contents are not yet loaded`);
      return false;
    }

    webContents.send.apply( webContents, args );
    return true;
  }

  _sendToPanel ( panelID, message, ...args ) {
    if ( typeof message !== 'string' ) {
      Console.error(`The message ${message} sent to panel ${panelID} must be a string`);
      return;
    }

    let opts = Ipc._popReplyAndTimeout(args);
    if ( !opts ) {
      args = ['editor:ipc-main2panel', panelID, message, ...args];
      if ( this._send.apply ( this, args ) === false ) {
        Console.failed( `send message "${message}" to panel "${panelID}" failed, no response received.` );
      }
      return;
    }

    let sessionId = Ipc._newSession(message, `${panelID}@main`, opts.reply, opts.timeout, this);
    this._currentSessions[sessionId] = opts.reply;

    //
    args = ['editor:ipc-main2panel', panelID, message, ...args, Ipc.option({
      sessionId: sessionId,
      waitForReply: true,
      timeout: opts.timeout, // this is only used as debug info
    })];
    this._send.apply(this, args);

    return sessionId;
  }

  _closeSession ( sessionId ) {
    if ( !this.nativeWin ) {
      return;
    }
    delete this._currentSessions[sessionId];
  }

  /**
   * @method send
   * @param {string} - The message name.
   * @param {...*} [arg] - Whatever arguments the message needs.
   * @param {function} [callback] - You can specify a callback function to receive IPC reply at the last or the 2nd last argument.
   * @param {number} [timeout] - You can specify a timeout for the callback at the last argument. If no timeout specified, it will be 5000ms.
   *
   * Send `message` with `...args` to renderer process asynchronously. It is possible to add a callback as the last or the 2nd last argument to receive replies from the IPC receiver.
   */
  send ( message, ...args ) {
    if ( typeof message !== 'string' ) {
      Console.error(`Send message failed for '${message}'. The message must be a string`);
      return;
    }

    let opts = Ipc._popReplyAndTimeout(args);
    if ( !opts ) {
      args = [message, ...args];
      if ( this._send.apply ( this, args ) === false ) {
        Console.failed( `send message "${message}" to window failed. No response was received.` );
      }
      return;
    }

    let sessionId = Ipc._newSession(message, `${this.nativeWin.id}@main`, opts.reply, opts.timeout, this);
    this._currentSessions[sessionId] = opts.reply;

    //
    args = ['editor:ipc-main2renderer', message, ...args, Ipc.option({
      sessionId: sessionId,
      waitForReply: true,
      timeout: opts.timeout, // this is only used as debug info
    })];
    this._send.apply(this, args);

    return sessionId;
  }

  /**
   * @method popupMenu
   * @param {object} template - the Menu template
   * @param {number} [x] - the x position
   * @param {number} [y] - the y position
   *
   * Popup a context menu
   */
  popupMenu ( template, x, y ) {
    if ( x !== undefined ) {
      x = Math.floor(x);
    }

    if ( y !== undefined ) {
      y = Math.floor(y);
    }

    let webContents = this.nativeWin.webContents;
    let editorMenu = new Menu(template,webContents);
    editorMenu.nativeMenu.popup(this.nativeWin, x, y);
    editorMenu.dispose();
  }

  // ========================================
  // properties
  // ========================================

  /**
   * @property {Boolean} isMainWindow
   *
   * If this is a main window.
   */
  get isMainWindow () {
    return Window.main === this;
  }

  /**
   * @property {Boolean} isFocused
   *
   * If the window is focused.
   */
  get isFocused () {
    return this.nativeWin.isFocused();
  }


  /**
   * @property {Boolean} isMinimized
   *
   * If the window is minimized.
   */
  get isMinimized () {
    return this.nativeWin.isMinimized();
  }

  /**
   * @property {Boolean} isLoaded
   *
   * If the window is loaded.
   */
  get isLoaded () {
    return this._loaded;
  }

  // ========================================
  // static window operation
  // ========================================

  /**
   * @property {Object} defaultLayout
   * @static
   *
   * The default layout.
   */
  static get defaultLayout () { return _defaultLayout; }
  static set defaultLayout (value) { _defaultLayout = value; }

  /**
   * @property {Array} windows
   * @static
   *
   * The current opened windows.
   */
  static get windows () {
    return _windows.slice();
  }

  /**
   * @property {Editor.Window} main
   * @static
   *
   * The main window.
   */
  static set main (value) { return _mainwin = value; }
  static get main () { return _mainwin; }

  // NOTE: this will in case save-layout not invoke,
  //       and it will missing info for current window
  static loadLayouts () {
    _windowLayouts = {};

    let profile = Profile.load( 'layout.windows', 'local', {
      version: '',
      windows: {},
    });

    for ( let name in profile.windows ) {
      let info = profile.windows[name];
      _windowLayouts[name] = info;
    }
  }

  /**
   * @method find
   * @static
   * @param {string|BrowserWindow|BrowserWindow.webContents} param
   * @return {Editor.Window}
   *
   * Find window by name or by BrowserWindow instance
   */
  static find ( param ) {
    // param === string
    if ( typeof param === 'string' ) {
      for ( let i = 0; i < _windows.length; ++i ) {
        let win = _windows[i];
        if ( win.name === param )
          return win;
      }

      return null;
    }

    // param === BrowserWindow
    if ( param instanceof BrowserWindow ) {
      for ( let i = 0; i < _windows.length; ++i ) {
        let win = _windows[i];
        if ( win.nativeWin === param ) {
          return win;
        }
      }

      return null;
    }

    // param === WebContents (NOTE: webContents don't have explicit constructor in electron)
    for ( let i = 0; i < _windows.length; ++i ) {
      let win = _windows[i];
      if ( win.nativeWin && win.nativeWin.webContents === param ) {
        return win;
      }
    }

    return null;
  }

  /**
   * @method addWindow
   * @static
   * @param {Editor.Window} win
   *
   * Add an editor window
   */
  static addWindow ( win ) {
    _windows.push(win);
  }

  /**
   * @method removeWindow
   * @static
   * @param {Editor.Window} win
   *
   * Remove an editor window
   */
  static removeWindow ( win ) {
    let idx = _windows.indexOf(win);
    if ( idx === -1 ) {
      Console.warn( `Cannot find window ${win.name}` );
      return;
    }
    _windows.splice(idx,1);
  }

  /**
   * @method commitWindowStates
   * @static
   *
   * Commit all opened window's state
   */
  static commitWindowStates () {
    for ( let i = 0; i < _windows.length; ++i ) {
      let editorWin = _windows[i];
      editorWin.commitWindowState();
    }
  }

  /**
   * @method saveWindowStates
   * @static
   *
   * Save current window's state to profile `layout.windows.json` at `local`
   */
  static saveWindowStates () {
    // do not save layout in test environment
    // TODO: change to App.argv._command
    if ( EditorM.argv._command === 'test' ) {
      return;
    }

    // we've quit the app, do not save layout after that.
    if ( !Window.main ) {
      return;
    }

    let profile = Profile.load( 'layout.windows', 'local' );
    profile.windows = {};
    for ( let i = 0; i < _windows.length; ++i ) {
      let editorWin = _windows[i];
      profile.windows[editorWin.name] = _windowLayouts[editorWin.name];
    }
    profile.version = EditorM.App.version;
    profile.save();
  }
} // end class Window

module.exports = Window;

const EditorM = require('./editor'); // DELME
const Protocol = require('./protocol');
const App = require('./app');
const Panel = require('./panel');
const Profile = require('./profile');
const Console = require('./console');
const Menu = require('./menu');
const Ipc = require('./ipc');

// ========================================
// Ipc
// ========================================

const ipcMain = Electron.ipcMain;

ipcMain.on('editor:window-open', ( event, name, url, options ) => {
  options = options || {};

  let editorWin = new Window(name, options);

  // NOTE: In Windows platform, hide the menu bar will make the content size increased to fill the menu bar space.
  // re-calling setContentSize will solve the problem
  editorWin.nativeWin.setMenuBarVisibility(false);
  if ( options.width && options.height ) {
    editorWin.nativeWin.setContentSize( options.width, options.height );
  }

  editorWin.load(url, options.argv);
  editorWin.show();
});

ipcMain.on('editor:window-query-layout', ( event ) => {
  let win = BrowserWindow.fromWebContents( event.sender );
  let editorWin = Window.find(win);
  if ( !editorWin ) {
    Console.warn('Failed to query layout, cannot find the window.');
    event.reply();
    return;
  }

  let layout = null;
  let needReset = false;

  let winInfo = _windowLayouts[editorWin.name];
  if ( winInfo && winInfo.layout ) {
    layout = winInfo.layout;
  }

  // if no layout found, and it is main window, reload layout
  if ( editorWin.isMainWindow && !layout ) {
    if ( Fs.existsSync(_defaultLayout) ) {
      try {
        layout = JSON.parse(Fs.readFileSync(_defaultLayout));
        needReset = true;
      } catch (err) {
        Console.error( `Failed to load default layout: ${err.message}` );
        layout = null;
      }
    }
  }

  //
  event.reply(null, layout, needReset);
});

ipcMain.on('editor:window-save-layout', ( event, layoutInfo ) => {
  let win = BrowserWindow.fromWebContents( event.sender );
  let editorWin = Window.find(win);
  if ( !editorWin ) {
    Console.warn('Failed to save layout, cannot find the window.');
    return;
  }
  editorWin.commitWindowState(layoutInfo);

  // save windows layout
  Window.saveWindowStates();
});

ipcMain.on('editor:window-focus', ( event ) => {
  let win = BrowserWindow.fromWebContents( event.sender );
  let editorWin = Window.find(win);
  if ( !editorWin ) {
    Console.warn('Failed to focus, cannot find the window.');
    return;
  }

  if ( !editorWin.isFocused ) {
    editorWin.focus();
  }
});

ipcMain.on('editor:window-load', ( event, url, argv ) => {
  let win = BrowserWindow.fromWebContents( event.sender );
  let editorWin = Window.find(win);
  if ( !editorWin ) {
    Console.warn('Failed to focus, cannot find the window.');
    return;
  }

  editorWin.load( url, argv );
});

ipcMain.on('editor:window-resize', ( event, w, h, useContentSize ) => {
  let win = BrowserWindow.fromWebContents( event.sender );
  let editorWin = Window.find(win);
  if ( !editorWin ) {
    Console.warn('Failed to focus, cannot find the window.');
    return;
  }

  if ( useContentSize ) {
    editorWin.nativeWin.setContentSize(w,h);
  } else {
    editorWin.nativeWin.setSize(w,h);
  }
});

ipcMain.on('editor:window-center', ( event ) => {
  let win = BrowserWindow.fromWebContents( event.sender );
  let editorWin = Window.find(win);
  if ( !editorWin ) {
    Console.warn('Failed to focus, cannot find the window.');
    return;
  }

  editorWin.nativeWin.center();
});

ipcMain.on('editor:window-inspect-at', ( event, x, y ) => {
  let nativeWin = BrowserWindow.fromWebContents( event.sender );
  if ( !nativeWin ) {
    Console.warn(`Failed to inspect at ${x}, ${y}, cannot find the window.` );
    return;
  }

  nativeWin.inspectElement( x, y );

  if ( nativeWin.devToolsWebContents ) {
    nativeWin.devToolsWebContents.focus();
  }
});
