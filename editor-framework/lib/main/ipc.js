'use strict';

/**
 * @module Editor.Ipc
 */
let Ipc = {};
module.exports = Ipc;

// requires
const Electron = require('electron');

const IpcBase = require('../share/ipc');
const Window = require('./window');
const Package = require('./package');
const Panel = require('./panel');
const Console = require('./console');

let _nextSessionId = 1000;
let _id2sessionInfo = {};
let _debug = false;

let _checkReplyArgs = IpcBase._checkReplyArgs;
let _popOptions = IpcBase._popOptions;
let _popReplyAndTimeout = IpcBase._popReplyAndTimeout;

let ErrorTimeout = IpcBase.ErrorTimeout;
let ErrorNoPanel = IpcBase.ErrorNoPanel;

// ========================================
// exports
// ========================================

// initialize messages APIs

Ipc.option = IpcBase.option;

/**
 * @method sendToAll
 * @param {string} message
 * @param {...*} [args] - whatever arguments the message needs
 * @param {object} [options] - you can indicate the options by Editor.Ipc.option({ excludeSelf: true })
 *
 * Send `message` with `...args` to all opened window and to main process asynchronously.
 */
Ipc.sendToAll = function (message, ...args) {
  if (args.length) {
    let excludeSelf = false;
    let opts = _popOptions(args);

    // check options
    if (opts && opts.excludeSelf) {
      excludeSelf = true;
    }

    args = [message, ...args];

    // send
    if (!excludeSelf) {
      _main2main.apply(null, args);
    }
    _send2wins.apply(null, args);

    return;
  }

  _main2main(message);
  _send2wins(message);
};

/**
 * @method sendToWins
 * @param {string} message
 * @param {...*} [args] - whatever arguments the message needs
 *
 * Send `message` with `...args` to all opened windows asynchronously. The renderer process
 * can handle it by listening to the message through the `Electron.ipcRenderer` module.
 *
 * @example
 * **Send IPC message (main process)**
 *
 *
 * ```js
 * Editor.Ipc.sendToWins('foo:bar', 'Hello World!');
 * ```
 *
 * **Receive IPC message (renderer process)**
 *
 *
 * ```html
 * <html>
 * <body>
 *   <script>
 *     require('ipc').on('foo:bar', (event, text) => {
 *       console.log(text);  // Prints "Hello World!"
 *     });
 *   </script>
 * </body>
 * </html>
 * ```
 */
Ipc.sendToWins = _send2wins;

/**
 * @method sendToMain
 * @param {string} message
 * @param {...*} [args] - whatever arguments the message needs
 * @param {function} [callback] - You can specify a callback function to receive IPC reply at the last or the 2nd last argument.
 * @param {number} [timeout] - You can specify a timeout for the callback at the last argument. If no timeout specified, it will be 5000ms.
 * @return {number} sessionID
 *
 * Send `message` with `...args` to main process asynchronously. It is possible to add a callback as the last or the 2nd last argument
 * to receive replies from the IPC receiver.
 *
 * Example:
 *
 * **Send IPC message (main process)**
 *
 * ```js
 * Editor.Ipc.sendToMain('foobar:say-hello', err => {
 *   if ( err.code === 'ETIMEOUT' ) {
 *     console.error('Timeout for ipc message foobar:say-hello');
 *     return;
 *   }
 *
 *   console.log('foobar replied');
 * });
 * ```
 *
 * **Receive and Reply IPC message (main process)**
 *
 * ```js
 * require('ipc').on('foobar:say-hello', event => {
 *   event.reply('Hi');
 * });
 * ```
 */
Ipc.sendToMain = function (message, ...args) {
  if ( typeof message !== 'string' ) {
    Console.error('Call to `sendToMain` failed. The message must be a string.');
    return;
  }

  let opts = _popReplyAndTimeout(args);
  if ( !opts ) {
    args = [message, ...args];
    if ( _main2main.apply ( null, args ) === false ) {
      Console.failed( `sendToMain "${message}" failed, no response received.` );
    }
    return;
  }

  let sessionId = _newSession(message, 'main', opts.reply, opts.timeout);

  args = [message, ...args, Ipc.option({
    sessionId: sessionId,
    waitForReply: true,
    timeout: opts.timeout, // this is only used as debug info
  })];

  if ( _main2mainOpts.apply ( null, args ) === false ) {
    Console.failed( `sendToMain "${message}" failed, no response received.` );
  }

  return sessionId;
};

/**
 * @method sendToPanel
 * @param {string} panelID
 * @param {string} message
 * @param {...*} [args] - whatever arguments the message needs
 * @param {function} [callback] - You can specify a callback function to receive IPC reply at the last or the 2nd last argument.
 * @param {number} [timeout] - You can specify a timeout for the callback at the last argument. If no timeout specified, it will be 5000ms.
 * @return {number} sessionID
 *
 * Send `message` with `...args` to panel defined in renderer process asynchronously. It is possible to add a callback as the last or the 2nd last argument to receive replies from the IPC receiver.
 *
 * Example:
 *
 * **Send IPC message (main process)**
 *
 * ```js
 * Editor.Ipc.sendToPanel('foobar', 'foobar:say-hello', err => {
 *   if ( err.code === 'ETIMEOUT' ) {
 *     console.error('Timeout for ipc message foobar:say-hello');
 *     return;
 *   }
 *
 *   console.log('foobar replied');
 * });
 * ```
 *
 * **Receive and Reply IPC message (renderer process)**
 *
 * ```js
 * Editor.Panel.extend({
 *   messages: {
 *     'foobar:say-hello' (event) {
 *       event.reply('Hi');
 *     }
 *   }
 * });
 * ```
 */
Ipc.sendToPanel = function (panelID, message, ...args) {
  let win = Panel.findWindow( panelID );
  if ( !win ) {
    let opts = Ipc._popReplyAndTimeout(args);
    if ( opts ) {
      opts.reply( new ErrorNoPanel(panelID, message) );
    }

    return;
  }

  let panelInfo = Package.panelInfo(panelID);
  if ( !panelInfo ) {
    return;
  }

  // ignore the panelID
  if ( panelInfo.type === 'simple' ) {
    win.send.apply( win, [message, ...args] );
    return;
  }

  //
  return win._sendToPanel.apply( win, [panelID, message, ...args] );
};

/**
 * @method sendToMainWin
 * @param {string} message
 * @param {...*} [args] - whatever arguments the message needs
 * @param {function} [callback] - an ipc callback
 * @param {number} [timeout] - timeout of the callback
 *
 * Send `message` with `...args` to the main window asynchronously. It is possible to add a callback as the last or the 2nd last argument to receive replies from the IPC receiver.
 */
// TODO: callback ??
Ipc.sendToMainWin = function (message, ...args) {
  let mainWin = Window.main;
  if ( !mainWin ) {
    // NOTE: do not use Editor.error here, since it will lead to ipc loop
    console.error(`Failed to send "${message}" to main window, the main window is not found.`);
    return;
  }

  mainWin._send.apply( mainWin, [message, ...args] );
};

/**
 * @method cancelRequest
 * @param {number} sessionId
 *
 * Cancel request sent to main or renderer process.
 */
Ipc.cancelRequest = function (sessionId) {
  _closeSession(sessionId);
};

Object.defineProperty(Ipc, 'debug', {
  enumerable: true,
  get () { return _debug; },
  set ( value ) { _debug = value; },
});

Ipc._popReplyAndTimeout = _popReplyAndTimeout; // only used in Window module
Ipc._newSession = _newSession;
Ipc._closeSession = _closeSession;

// NOTE: this is only used in Editor.Window
Ipc._closeSessionThroughWin = function (sessionId) {
  let info = _id2sessionInfo[sessionId];
  if ( info ) {
    delete _id2sessionInfo[sessionId];

    if ( info.timeoutId ) {
      clearTimeout(info.timeoutId);
    }
  }
};

// ========================================
// Internal
// ========================================

function _newSession ( message, prefix, fn, timeout, win ) {
  let sessionId = `${prefix}:${_nextSessionId++}`;
  let timeoutId;

  if ( timeout !== -1 ) {
    timeoutId = setTimeout(() => {
      let info = _id2sessionInfo[sessionId];

      if ( info ) {
        if ( info.win ) {
          info.win._closeSession(sessionId);
        }

        delete _id2sessionInfo[sessionId];

        info.callback(new ErrorTimeout( message, sessionId, timeout ));
      }

      // DISABLE
      // if ( _debug ) {
      //   Console.warn(`ipc timeout. message: ${message}, session: ${sessionId}`);
      // }
    }, timeout);
  }

  _id2sessionInfo[sessionId] = {
    sessionId: sessionId,
    timeoutId: timeoutId,
    win: win,
    callback: fn,
  };

  return sessionId;
}

function _closeSession ( sessionId ) {
  let info = _id2sessionInfo[sessionId];

  if ( info ) {
    delete _id2sessionInfo[sessionId];

    if ( info.win ) {
      info.win._closeSession(sessionId);
    }

    if ( info.timeoutId ) {
      clearTimeout(info.timeoutId);
    }
  }

  return info;
}

function _send2wins (message, ...args) {
  args = [message, ...args];

  // NOTE: duplicate windows list since window may close during events
  let winlist = Window.windows.slice();
  for ( let i = 0; i < winlist.length; ++i ) {
    let win = winlist[i];
    win._send.apply( win, args );
  }
}

/**
 * Send `args...` to windows except the excluded
 * @method _main2renderersExclude
 * @param {object} excluded - A [WebContents](https://github.com/atom/electron/blob/master/docs/api/browser-window.md#class-webcontents) object.
 * @param {...*} [args] - whatever arguments the message needs
 */
function _main2renderersExclude (excluded, ...args) {
  // NOTE: duplicate windows list since window may close during events
  let winlist = Window.windows.slice();
  for ( let i = 0; i < winlist.length; ++i ) {
    let win = winlist[i];
    if (win.nativeWin.webContents !== excluded) {
      win._send.apply( win, args );
    }
  }
}

function _main2renderers (message, ...args) {
  if ( args.length === 0 ) {
    _send2wins( message );
    return;
  }

  // send
  _send2wins.apply( null, [message, ...args] );
}

function _main2mainOpts (message, ...args) {
  let event = {
    senderType: 'main',
    sender: {
      send: Ipc.sendToMain
    }
  };

  if ( args.length === 0 ) {
    return ipcMain.emit( message, event );
  }

  // process waitForReply option
  let opts = _popOptions(args);
  if ( opts && opts.waitForReply ) {
    // NOTE: do not directly use message in event.reply, it will cause Electron devtools crash
    let msg = message;
    event.reply = function (...replyArgs) {
      if ( _debug && !_checkReplyArgs(replyArgs) ) {
        Console.warn(`Invalid argument for event.reply of "${msg}": the first argument must be an instance of "Error" or "null"`);
        // return; // TEMP DISABLE
      }

      let replyOpts = Ipc.option({
        sessionId: opts.sessionId
      });
      replyArgs = [`editor:ipc-reply`, event, ...replyArgs, replyOpts];
      return ipcMain.emit.apply( ipcMain, replyArgs );
    };
  }

  // insert event as 2nd parameter in args
  args = [message, event, ...args];
  return ipcMain.emit.apply( ipcMain, args );
}

function _main2main (message, ...args) {
  let event = {
    senderType: 'main',
    sender: {
      send: Ipc.sendToMain
    }
  };

  if ( args.length === 0 ) {
    return ipcMain.emit( message, event );
  }

  // insert event as 2nd parameter in args
  args = [message, event, ...args];
  return ipcMain.emit.apply( ipcMain, args );
}

function _renderer2mainOpts (event, message, ...args) {
  if ( args.length === 0 ) {
    return ipcMain.emit( message, event );
  }

  // process waitForReply option
  let opts = _popOptions(args);
  if ( opts && opts.waitForReply ) {
    // NOTE: do not directly use event, message in event.reply, it will cause Electron devtools crash
    let sender = event.sender;
    let msg = message;

    // NOTE: cache to detect if win destroyed
    // this is faster than Electron.BrowserWindow.fromWebContents(sender)
    let win = Window.find(sender);

    event.reply = function (...replyArgs) {
      // if the sender is invalid (window destroyed)
      if ( !win.nativeWin ) {
        return;
      }

      if ( _debug && !_checkReplyArgs(replyArgs) ) {
        Console.warn(`Invalid argument for event.reply of "${msg}": the first argument must be an instance of "Error" or "null"`);
        // return; // TEMP DISABLE
      }

      let replyOpts = Ipc.option({
        sessionId: opts.sessionId
      });
      replyArgs = [`editor:ipc-reply`, ...replyArgs, replyOpts];
      return sender.send.apply( sender, replyArgs );
    };
  }

  // refine the args
  args = [message, event, ...args];
  return ipcMain.emit.apply( ipcMain, args );
}

function _renderer2main (event, message, ...args) {
  if ( args.length === 0 ) {
    return ipcMain.emit( message, event );
  }

  // refine the args
  args = [message, event, ...args];
  return ipcMain.emit.apply( ipcMain, args );
}

function _renderer2panelOpts (event, panelID, message, ...args) {
  if ( args.length === 0 ) {
    Ipc.sendToPanel.apply( null, [panelID, message, ...args] );
    return;
  }

  // process waitForReply option
  let opts = _popOptions(args);
  if ( opts && opts.waitForReply ) {
    // NOTE: do not directly use event, message in event.reply, it will cause Electron devtools crash
    let sender = event.sender;

    // NOTE: cache to detect if win destroyed
    // this is faster than Electron.BrowserWindow.fromWebContents(sender)
    let win = Window.find(sender);

    let sessionIdAtMain = _newSession(message, `${panelID}@main`, function (...replyArgs) {
      // if the sender is invalid (window destroyed)
      if ( !win.nativeWin ) {
        return;
      }

      let replyOpts = Ipc.option({
        sessionId: opts.sessionId
      });
      replyArgs = [`editor:ipc-reply`, ...replyArgs, replyOpts];
      return sender.send.apply( sender, replyArgs );
    }, opts.timeout);

    // refine the args
    args = [panelID, message, ...args, Ipc.option({
      sessionId: sessionIdAtMain,
      waitForReply: true,
      timeout: opts.timeout, // this is only used as debug info
    })];
  } else {
    // refine the args
    args = [panelID, message, ...args];
  }

  Ipc.sendToPanel.apply( null, args );
}

function _renderer2renderersOpts (event, message, ...args) {
  // check options
  let opts = _popOptions(args);
  if (opts && opts.excludeSelf) {
    _main2renderersExclude.apply( null, [event.sender, message, ...args] );
    return;
  }

  _main2renderers.apply(null, [message, ...args]);
}

// ========================================
// Ipc
// ========================================

const ipcMain = Electron.ipcMain;

ipcMain.on('editor:ipc-renderer2all', (event, message, ...args) => {
  let opts = _popOptions(args);

  _renderer2main.apply(null, [event, message, ...args]);

  if (opts && opts.excludeSelf) {
    _main2renderersExclude.apply( null, [event.sender, message, ...args] );
  } else {
    _main2renderers.apply(null, [message, ...args]);
  }
});

ipcMain.on('editor:ipc-renderer2wins', _renderer2renderersOpts );

ipcMain.on('editor:ipc-renderer2main', (event, message, ...args) => {
  if ( _renderer2mainOpts.apply ( null, [event, message, ...args] ) === false ) {
    Console.failed( `Message "${message}" from renderer to main failed, no response receieved.` );
  }
});

ipcMain.on('editor:ipc-renderer2panel', (event, panelID, message, ...args) => {
  _renderer2panelOpts(event, panelID, message, ...args);
});

ipcMain.on('editor:ipc-renderer2mainwin', (event, message, ...args) => {
  let mainWin = Window.main;
  if (!mainWin) {
    // NOTE: do not use Console.error here, since it will lead to ipc loop
    console.error(`Failed to send "${message}" because the main page is not initialized.`);
    return;
  }

  if (args.length) {
    // discard event arg
    mainWin._send.apply( mainWin, [message, ...args] );
  } else {
    mainWin._send( message );
  }
});

ipcMain.on('editor:ipc-reply', (event, ...args) => {
  let opts = _popOptions(args);

  // NOTE: we must close session before it apply, this will prevent window.close() invoked in
  // reply callback will make _closeSession called second times.
  let info = _closeSession(opts.sessionId);
  if (info) {
    info.callback.apply(null, args);
  }
});
