'use strict';

const Electron = require('electron');
const EventEmitter = require('events');
const Path = require('fire-path');

const app = Electron.app;
const events = new EventEmitter();

/**
 * @module Editor.App
 *
 * The Editor.App is your app.js module. Read more details in
 * [Define your application](https://github.com/cocos-creator/editor-framework/blob/master/docs/manual/define-your-app.md).
 */
module.exports = {
  /**
   * @property name
   * @type string
   *
   * The name of your app loaded from the `name` field in `package.json`.
   */
  name: app.getName(),

  /**
   * @property version
   * @type string
   *
   * The version of your app loaded from the `version` field in `package.json`.
   */
  version: app.getVersion(),

  /**
   * @property path
   * @type string
   *
   * Your path of your application.
   */
  path: app.getAppPath(),

  /**
   * @property home
   * @type string
   *
   * Your application's home path. Usually it is `~/.{your-app-name}`
   */
  home: Path.join(app.getPath('home'), `.${app.getName()}`),

  /**
   * @property focused
   * @type boolean
   *
   * Indicates if application is focused
   */
  focused: false,

  /**
   * @method extend
   * @param {object} proto
   *
   * Extends the Editor.App module
   */
  extend ( proto ) {
    Object.assign( this, proto );
  },

  /**
   * @method on
   * @param {string} eventName - The name of the event
   * @param {function} listener - The callback function
   *
   * Adds an event listner function.
   */
  on ( eventName, listener ) {
    return events.on.apply(this, [eventName, listener]);
  },

  /**
   * @method off
   * @param {string} eventName - The name of the event
   * @param {function} listener - The callback function
   *
   * Removes an event listner function.
   */
  off ( eventName, listener ) {
    return events.removeListener.apply(this, [eventName, listener]);
  },

  /**
   * @method once
   * @param {string} eventName - The name of the event
   * @param {function} listener - The callback function
   *
   * Adds a one time event listner function.
   */
  once ( eventName, listener ) {
    return events.once.apply(this, [eventName, listener]);
  },

  /**
   * @method emit
   * @param {string} eventName - The name of the event
   * @param {...*} [args] - Arguments
   *
   * Emits event by name.
   */
  emit ( eventName, ...args) {
    return events.emit.apply(this, [eventName, ...args]);
  },
};
