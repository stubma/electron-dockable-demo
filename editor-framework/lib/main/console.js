'use strict';

/**
 * @module Editor
 */
let Console = {};
module.exports = Console;

// requires
const Electron = require('electron');
const Util = require('util');
const Winston = require('winston');

const Ipc = require('./ipc');

let _consoleConnected = false;
let _logs = [];

// ==========================
// exports
// ==========================

/**
 * @method trace
 * @param {string} level - The log level
 * @param {...*} [args] - whatever arguments the message needs
 *
 * Trace the log
 */
Console.trace = function (level,...args) {
  let text = Util.format.apply(Util, args);

  let err = new Error('dummy');
  let lines = err.stack.split('\n');

  // remove stack frame of Editor.error without allocating new Array
  lines.shift();
  lines[0] = text;
  text = lines.join('\n');

  if ( _consoleConnected ) {
    _logs.push({ type: level, message: text });
  }

  Winston[level](text);
  Ipc.sendToWins(`editor:console-${level}`,text);
};

/**
 * @method log
 * @param {...*} [args] - whatever arguments the message needs
 *
 * Log the normal message and show on the console.
 * The method will send ipc message `editor:console-log` to all windows.
 */
Console.log = function (...args) {
  let text = Util.format.apply(Util, args);

  if ( _consoleConnected ) {
    _logs.push({ type: 'log', message: text });
  }

  Winston.normal(text);
  Ipc.sendToWins('editor:console-log',text);
};

/**
 * @method success
 * @param {...*} [args] - whatever arguments the message needs
 *
 * Log the success message and show on the console
 * The method will send ipc message `editor:console-success` to all windows.
 */
Console.success = function (...args) {
  let text = Util.format.apply(Util, args);

  if ( _consoleConnected ) {
    _logs.push({ type: 'success', message: text });
  }

  Winston.success(text);
  Ipc.sendToWins('editor:console-success',text);
};

/**
 * @method failed
 * @param {...*} [args] - whatever arguments the message needs
 *
 * Log the failed message and show on the console
 * The method will send ipc message `editor:console-failed` to all windows.
 */
Console.failed = function (...args) {
  let text = Util.format.apply(Util, args);

  if ( _consoleConnected ) {
    _logs.push({ type: 'failed', message: text });
  }

  Winston.failed(text);
  Ipc.sendToWins('editor:console-failed',text);
};

/**
 * @method info
 * @param {...*} [args] - whatever arguments the message needs
 *
 * Log the info message and show on the console
 * The method will send ipc message `editor:console-info` to all windows.
 */
Console.info = function (...args) {
  let text = Util.format.apply(Util, args);

  if ( _consoleConnected ) {
    _logs.push({ type: 'info', message: text });
  }

  Winston.info(text);
  Ipc.sendToWins('editor:console-info',text);
};

/**
 * @method warn
 * @param {...*} [args] - whatever arguments the message needs
 *
 * Log the warnning message and show on the console,
 * it also shows the call stack start from the function call it.
 * The method will send ipc message `editor:console-warn` to all windows.
 */
Console.warn = function (...args) {
  let text = Util.format.apply(Util, args);

  if ( _consoleConnected ) {
    _logs.push({ type: 'warn', message: text });
  }

  Winston.warn(text);
  Ipc.sendToWins('editor:console-warn',text);
};

/**
 * @method error
 * @param {...*} [args] - whatever arguments the message needs
 *
 * Log the error message and show on the console,
 * it also shows the call stack start from the function call it.
 * The method will sends ipc message `editor:console-error` to all windows.
 */
Console.error = function (...args) {
  let text = Util.format.apply(Util, args);

  let err = new Error('dummy');
  let lines = err.stack.split('\n');

  // remove stack frame of Editor.error without allocating new Array
  lines.shift();
  lines[0] = text;
  text = lines.join('\n');

  if ( _consoleConnected ) {
    _logs.push({ type: 'error', message: text });
  }

  Winston.error(text);
  Ipc.sendToWins('editor:console-error',text);
};

/**
 * @method fatal
 * @param {...*} [args] - whatever arguments the message needs
 *
 * Log the fatal message and show on the console,
 * the app will quit immediately after that.
 */
Console.fatal = function (...args) {
  let text = Util.format.apply(Util, args);

  let e = new Error('dummy');
  let lines = e.stack.split('\n');

  // remove stack frame of Editor.error without allocating new Array
  lines.shift();
  lines[0] = text;
  text = lines.join('\n');

  if ( _consoleConnected ) {
    _logs.push({ type: 'fatal', message: text });
  }

  Winston.fatal(text);
  // NOTE: fatal error will close app immediately, no need for ipc.
};

/**
 * @method connectToConsole
 *
 * Connect to console panel. Once the console connected, all logs will kept in `core-level` and display
 * on the console panel in `page-level`.
 */
Console.connectToConsole = function () {
  _consoleConnected = true;
};

/**
 * @method clearLog
 * @param {string} [pattern] - Specify the clear pattern
 * @param {boolean} [useRegex] - If we use regex for the clear pattern
 *
 * Clear the logs. If we specify `pattern` for the method, it will clear the match pattern.
 * The method will send ipc message `editor:console-clear` to all windows.
 */
Console.clearLog = function ( pattern, useRegex ) {
  if (!pattern) {
    _logs = [];
  } else {
    let filter;
    if ( useRegex ) {
      try {
        filter = new RegExp(pattern);
      } catch ( err ) {
        filter = new RegExp('');
      }
    } else {
      filter = pattern;
    }

    for (let i = _logs.length - 1; i >= 0; i--) {
      let log = _logs[i];

      if (useRegex) {
        if ( filter.exec(log.message) ) {
          _logs.splice(i, 1);
        }
      } else {
        if ( log.message.indexOf(filter) !== -1 ) {
          _logs.splice(i, 1);
        }
      }
    }
  }

  Ipc.sendToAll('editor:console-clear', pattern, useRegex);
};

// ==========================
// Ipc Events
// ==========================

const ipcMain = Electron.ipcMain;

function _logInMain (level, text, ...args) {
  text = Util.format.apply(Util, [text,...args]);

  if ( _consoleConnected ) {
    _logs.push({ type: level, message: text });
  }

  if ( level === 'log' ) {
    Winston.normal(text);
  } else {
    Winston[level](text);
  }
  Ipc.sendToWins(`editor:console-${level}`,text);
}

ipcMain.on('editor:renderer-console-log', (event, ...args) => {
  _logInMain.apply(null, ['log',...args]);
});

ipcMain.on('editor:renderer-console-success', (event, ...args) => {
  _logInMain.apply(null, ['success',...args]);
});

ipcMain.on('editor:renderer-console-failed', (event, ...args) => {
  _logInMain.apply(null, ['failed',...args]);
});

ipcMain.on('editor:renderer-console-info', (event, ...args) => {
  _logInMain.apply(null, ['info',...args]);
});

ipcMain.on('editor:renderer-console-warn', (event, ...args) => {
  _logInMain.apply(null, ['warn',...args]);
});

ipcMain.on('editor:renderer-console-error', (event, ...args) => {
  _logInMain.apply(null, ['error',...args]);
});

ipcMain.on('editor:renderer-console-trace', (event, level, ...args) => {
  _logInMain.apply(null, [level,...args]);
});

ipcMain.on('editor:console-query', ( event ) => {
  event.reply(null,_logs);
});
