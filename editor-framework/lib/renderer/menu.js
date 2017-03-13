'use strict';

/**
 * @module Editor.Menu
 */
let Menu = {};
module.exports = Menu;

// requires
const Ipc = require('./ipc');
const Console = require('./console');

// ==========================
// exports
// ==========================

Menu.checkTemplate = function ( template ) {
  // ensure no click
  for ( var i = 0; i < template.length; ++i ) {
    var item = template[i];

    if ( item.click ) {
      Console.error('The `click` event is not currently implemented for a page-level menu declaration due to known IPC deadlock problems in Electron');
      return false;
    }

    if ( item.submenu && !Menu.checkTemplate(item.submenu) ) {
      return false;
    }
  }
  return true;
};

/**
 * @method popup
 * @param {object} template - menu template
 * @param {number} [x] - position x
 * @param {number} [y] - position y
 *
 * Send `menu:popup` to main process.
 */
Menu.popup = function (template, x, y) {
  if ( Menu.checkTemplate(template) ) {
    Ipc.sendToMain('menu:popup', template, x, y);
  }
};

/**
 * @method register
 * @param {string} name - name of the register menu
 * @param {object} tmpl - menu template
 * @param {boolean} [force] - force to register a menu even it was registered before.
 *
 * Send `menu:register` to main process.
 */
Menu.register = function ( name, tmpl, force ) {
  if ( Menu.checkTemplate(tmpl) ) {
    Ipc.sendToMain('menu:register', name, tmpl, force);
  }
};

/**
 * @method walk
 * @param {object[]|object} template
 * @param {function} fn
 */
Menu.walk = function ( template, fn ) {
  if ( !Array.isArray(template) ) {
    template = [template];
  }

  template.forEach(item => {
    fn(item);
    if ( item.submenu ) {
      Menu.walk( item.submenu, fn );
    }
  });
};
