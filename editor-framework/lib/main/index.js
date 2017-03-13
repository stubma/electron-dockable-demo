'use strict';

// export EditorM
let EditorM = require('./editor');

Object.assign( EditorM, require('../share/platform') );
Object.assign( EditorM, require('./console') );

EditorM.IpcListener = require('../share/ipc-listener');
EditorM.JS = require('../share/js-utils');
EditorM.KeyCode = require('../share/keycode');
EditorM.Math = require('../share/math');
EditorM.Selection = require('../share/selection');
EditorM.Undo = require('../share/undo');
EditorM.Utils = require('../share/utils');

EditorM.App = require('./app');
EditorM.DevTools = require('./devtools');
EditorM.Dialog = require('./dialog');
EditorM.Ipc = require('./ipc');
EditorM.MainMenu = require('./main-menu');
EditorM.Menu = require('./menu');
EditorM.Debugger = require('./debugger');
EditorM.Package = require('./package');
EditorM.Panel = require('./panel');
EditorM.Profile = require('./profile');
EditorM.Protocol = require('./protocol');
EditorM.Window = require('./window');
EditorM.Worker = require('./worker');
EditorM.i18n = require('./i18n');

EditorM.T = EditorM.i18n.t;

// global
global.unused = () => {};
global.deprecate = function (fn, msg, trace) {
  trace = trace !== undefined ? trace : false;
  let warned = false;

  function deprecated() {
    if ( trace ) {
      EditorM.trace('warn',msg);
    } else {
      if ( !warned ) {
        EditorM.warn(msg);
        warned = true;
      }
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};
global.Editor = EditorM;

//
require('./deprecated');

// export
module.exports = EditorM;
