'use strict';

/**
 * @module Editor.MainMenu
 */
let MainMenu = {};
module.exports = MainMenu;

// requires
const Ipc = require('./ipc');
const Menu = require('./menu');

// ==========================
// exports
// ==========================

/**
 * @method init
 *
 * Send `main-menu:init` to main process.
 */
MainMenu.init = function () {
  Ipc.sendToMain('main-menu:init');
};

/**
 * @method apply
 *
 * Send `main-menu:apply` to main process.
 */
MainMenu.apply = function () {
  Ipc.sendToMain('main-menu:apply');
};

/**
 * @method update
 * @param {string} path - A menu path
 * @param {object[]|object} - template
 *
 * Send `main-menu:update` to main process.
 */
MainMenu.update = function ( path, template ) {
  if ( Menu.checkTemplate(template) ) {
    Ipc.sendToMain('main-menu:update', path, template);
  }
};

/**
 * @method add
 * @param {string} path - A menu path
 * @param {object[]|object} - template
 *
 * Send `main-menu:add` to main process.
 */
MainMenu.add = function ( path, template ) {
  if ( Menu.checkTemplate(template) ) {
    Ipc.sendToMain('main-menu:add', path, template);
  }
};

/**
 * @method remove
 * @param {string} path - A menu path
 *
 * Send `main-menu:remove` to main process.
 */
MainMenu.remove = function ( path ) {
  Ipc.sendToMain('main-menu:remove', path);
};

/**
 * @method set
 * @param {string} path - A menu path
 * @param {object} [options]
 * @param {NativeImage} [options.icon] - A [NativeImage](https://github.com/atom/electron/blob/master/docs/api/native-image.md)
 * @param {Boolean} [options.enabled]
 * @param {Boolean} [options.visible]
 * @param {Boolean} [options.checked] - NOTE: You must set your menu-item type to 'checkbox' to make it work
 *
 * Send `main-menu:set` to main process.
 */
MainMenu.set = function ( path, options ) {
  Ipc.sendToMain('main-menu:set', path, options);
};
