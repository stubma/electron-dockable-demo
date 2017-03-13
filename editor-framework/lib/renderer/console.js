'use strict';

/**
 * @module Editor
 */
let Console = {};
module.exports = Console;

// requires
const Util = require('util');
const Ipc = require('./ipc');

// ==========================
// exports
// ==========================

/**
 * @method trace
 * @param {string} level - Log level
 * @param {...} [args] - whatever arguments the message needs
 *
 * Trace the log
 */
Console.trace = function (level, text, ...args) {
  if ( args.length ) {
    text = Util.format.apply(Util, [text,...args]);
  } else {
    text = '' + text;
  }
  console.trace(text);

  let e = new Error('dummy');
  let lines = e.stack.split('\n');

  // remove stack frame of Editor.error without allocating new Array
  lines.shift();
  lines[0] = text;
  text = lines.join('\n');

  Ipc.sendToMain('editor:renderer-console-trace',level,text);
};

/**
 * @method log
 * @param {...*} [arg] - whatever arguments the message needs
 *
 * Log the normal message and show on the console.
 * The method will send ipc message `editor:renderer-console-log` to the main process.
 */
Console.log = function (text, ...args) {
  if ( args.length ) {
    text = Util.format.apply(Util, arguments);
  } else {
    text = '' + text;
  }
  console.log(text);
  Ipc.sendToMain('editor:renderer-console-log', text);
};

/**
 * @method success
 * @param {...*} [arg] - whatever arguments the message needs
 *
 * Log the success message and show on the console.
 * The method will send ipc message `editor:renderer-console-success` to the main process.
 */
Console.success = function (text, ...args) {
  if ( args.length ) {
    text = Util.format.apply(Util, arguments);
  } else {
    text = '' + text;
  }
  console.log('%c' + text, 'color: green');
  Ipc.sendToMain('editor:renderer-console-success', text);
};

/**
 * @method failed
 * @param {...*} [arg] - whatever arguments the message needs
 *
 * Log the failed message and show on the console.
 * The method will send ipc message `editor:renderer-console-failed` to the main process.
 */
Console.failed = function (text, ...args) {
  if ( args.length ) {
    text = Util.format.apply(Util, arguments);
  } else {
    text = '' + text;
  }
  console.log('%c' + text, 'color: red');
  Ipc.sendToMain('editor:renderer-console-failed', text);
};

/**
 * @method info
 * @param {...*} [arg] - whatever arguments the message needs
 *
 * Log the info message and show on the console.
 * The method will send ipc message `editor:renderer-console-info` to the main process.
 */
Console.info = function (text, ...args) {
  if ( args.length ) {
    text = Util.format.apply(Util, arguments);
  } else {
    text = '' + text;
  }
  console.info(text);
  Ipc.sendToMain('editor:renderer-console-info', text);
};

/**
 * @method warn
 * @param {...*} [arg] - whatever arguments the message needs
 *
 * Log the warn message and show on the console.
 * The method will send ipc message `editor:renderer-console-warn` to the main process.
 */
Console.warn = function (text, ...args) {
  if ( args.length ) {
    text = Util.format.apply(Util, arguments);
  } else {
    text = '' + text;
  }
  console.warn(text);
  Ipc.sendToMain('editor:renderer-console-warn', text);
};

/**
 * @method error
 * @param {...*} [arg] - whatever arguments the message needs
 *
 * Log the error message and show on the console.
 * The method will send ipc message `editor:renderer-console-error` to the main process.
 */
Console.error = function (text, ...args) {
  if ( args.length ) {
    text = Util.format.apply(Util, arguments);
  } else {
    text = '' + text;
  }
  console.error(text);

  let e = new Error('dummy');
  let lines = e.stack.split('\n');

  // remove stack frame of Editor.error without allocating new Array
  lines.shift();
  lines[0] = text;
  text = lines.join('\n');

  Ipc.sendToMain('editor:renderer-console-error',text);
};
