'use strict';

// export EditorR
let EditorR = require('./editor');

Object.assign( EditorR, require('../share/platform') );
Object.assign( EditorR, require('./console') );

EditorR.Easing = require('../share/easing');
EditorR.IpcListener = require('../share/ipc-listener');
EditorR.JS = require('../share/js-utils');
EditorR.KeyCode = require('../share/keycode');
EditorR.Math = require('../share/math');
EditorR.Selection = require('../share/selection');
EditorR.Undo = require('../share/undo');
EditorR.Utils = require('../share/utils');

EditorR.Audio = require('./audio');
EditorR.Dialog = require('./dialog');
EditorR.Ipc = require('./ipc');
EditorR.MainMenu = require('./main-menu');
EditorR.Menu = require('./menu');
EditorR.Package = require('./package');
EditorR.Panel = require('./panel');
EditorR.Protocol = require('./protocol');
EditorR.Window = require('./window' );
EditorR.i18n = require('./i18n');

EditorR.T = EditorR.i18n.t;

//
EditorR.UI = require('./ui');

// NOTE: deprecated
EditorR.polymerPanel = EditorR.UI.PolymerUtils.registerPanel;
EditorR.polymerElement = EditorR.UI.PolymerUtils.registerElement;

// global
window.unused = () => {};
window.deprecate = function (fn, msg, trace) {
  trace = trace !== undefined ? trace : false;
  let warned = false;

  function deprecated() {
    if ( trace ) {
      EditorR.trace('warn',msg);
    } else {
      if (!warned) {
        EditorR.warn(msg);
        warned = true;
      }
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};

window.Editor = EditorR;

//
require('./deprecated');

// export
module.exports = EditorR;
