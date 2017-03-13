'use strict';

/**
 * @module Editor.Package
 */
let Package = {};
module.exports = Package;

// requires
const Ipc = require('./ipc');

// ==========================
// exports
// ==========================

/**
 * @method reload
 * @param {string} name - The package name
 *
 * Send `editor:package-reload` to main process.
 */
Package.reload = function ( name ) {
  Ipc.sendToMain('editor:package-reload', name);
};

/**
 * @method queryInfos
 * @param {function} cb
 *
 * Send `editor:package-query-infos` to main process.
 */
Package.queryInfos = function ( cb ) {
  Ipc.sendToMain('editor:package-query-infos', cb);
};

/**
 * @method queryInfo
 * @param {string} name - The package name
 * @param {function} cb
 *
 * Send `editor:package-query-info` to main process.
 */
Package.queryInfo = function ( name, cb ) {
  Ipc.sendToMain('editor:package-query-info', name, cb);
};
