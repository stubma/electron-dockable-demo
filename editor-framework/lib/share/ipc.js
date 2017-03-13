'use strict';

let IpcBase = {};

IpcBase._checkReplyArgs = function (args) {
  if ( args.length === 0 ) {
    return true;
  }

  let first = args[0];
  if ( first === null || first instanceof Error ) {
    return true;
  }

  return false;
};

IpcBase._popOptions = function (args) {
  let opts = args[args.length - 1];

  if ( opts && typeof opts === 'object' && opts.__ipc__ ) {
    args.pop(); // args.splice(-1,1);
    return opts;
  }

  return null;
};

IpcBase._popReplyAndTimeout = function (args) {
  // arguments check
  let reply, timeout;
  let lastArg = args[args.length - 1];

  if (typeof lastArg === 'number') {
    if ( args.length < 2 ) {
      return null;
    }

    timeout = lastArg;
    lastArg = args[args.length - 2];
    if (typeof lastArg !== 'function') {
      return null;
    }

    reply = lastArg;
    args.splice(-2,2);
  } else {
    if (typeof lastArg !== 'function') {
      return null;
    }

    reply = lastArg;
    timeout = 5000;
    args.pop();
  }

  return {
    reply: reply,
    timeout: timeout,
  };
};

/**
 * @method option
 * @param {object} - opts
 * @param {boolean} - opts.excludeSelf
 * @param {boolean} - opts.waitForReply
 * @param {number} - opts.timeout
 *
 * Ipc option used as last arguments in message.
 */
IpcBase.option = function (opts) {
  opts.__ipc__ = true;
  return opts;
};

class ErrorTimeout extends Error {
  /**
   * @param {string} message
   * @param {string} sessionId
   * @param {number} timeout
   */
  constructor ( message, sessionId, timeout ) {
    super(`ipc timeout. message: ${message}, session: ${sessionId}`);

    this.code = 'ETIMEOUT';
    this.ipc = message;
    this.sessionId = sessionId;
    this.timeout = timeout;
  }
}

class ErrorNoPanel extends Error {
  /**
   * @param {string} panelID
   * @param {string} message
   */
  constructor ( panelID, message ) {
    super(`ipc failed to send, panel not found. panel: ${panelID}, message: ${message}`);

    this.code = 'ENOPANEL';
    this.ipc = message;
    this.panelID = panelID;
  }
}

class ErrorNoMsg extends Error {
  /**
   * @param {string} panelID
   * @param {string} message
   */
  constructor ( panelID, message ) {
    super(`ipc failed to send, message not found. panel: ${panelID}, message: ${message}`);

    this.code = 'ENOMSG';
    this.ipc = message;
    this.panelID = panelID;
  }
}

IpcBase.ErrorTimeout = ErrorTimeout;
IpcBase.ErrorNoPanel = ErrorNoPanel;
IpcBase.ErrorNoMsg = ErrorNoMsg;
// IpcBase.ErrorNoWin = ErrorNoWin; // TODO?

module.exports = IpcBase;
