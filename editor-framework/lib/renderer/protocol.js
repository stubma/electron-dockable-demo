'use strict';

/**
 * @module Protocol
 */
let Protocol = {};
module.exports = Protocol;

// requires
const Path = require('fire-path');
const Url = require('fire-url');

let _appPath;
let _frameworkPath;
let _remoteEditor;

let _defaultProtocols = [
  'http:',
  'https:',
  'ftp:',
  'ssh:',
  'file:',
];
let _protocol2fn = {};

// ==========================
// exports
// ==========================

Protocol.init = function (editorR) {
  _appPath = editorR.appPath;
  _frameworkPath = editorR.frameworkPath;
  _remoteEditor = editorR.remote;

  editorR.Protocol.register('editor-framework', _url2path(_frameworkPath));
  editorR.Protocol.register('app', _url2path(_appPath));
};

// url
Protocol.url = function (url) {
  let urlInfo = Url.parse(url);

  if ( !urlInfo.protocol ) {
    return url;
  }

  if ( _defaultProtocols.indexOf(urlInfo.protocol) !== -1 ) {
    return url;
  }

  // NOTE: we cache some protocol such as app:// and editor-framework:// to get rid of ipc-sync function calls
  let fn = _protocol2fn[urlInfo.protocol];
  if ( fn ) {
    return fn(urlInfo);
  }

  // use ipc-sync if we are not in Editor.importing state
  return _remoteEditor.url(url);
};

/**
 * @method register
 * @param {string} protocol
 * @param {function} fn
 *
 * Register a protocol so that {@link Editor.url} can use it to convert an url to the filesystem path.
 * The `fn` accept an url Object via [url.parse](https://iojs.org/api/url.html#url_url_parse_urlstr_parsequerystring_slashesdenotehost)
 *
 * @example
 * ```js
 * const Path = require('path');
 *
 * let _url2path = base => {
 *   return urlInfo => {
 *     if ( urlInfo.pathname ) {
 *       return Path.join( base, urlInfo.host, urlInfo.pathname );
 *     }
 *     return Path.join( base, urlInfo.host );
 *   };
 * };
 *
 * Editor.Protocol.register('editor-framework', _url2path(Editor.frameworkPath));
 * ```
 */
Protocol.register = function ( protocol, fn ) {
  _protocol2fn[protocol+':'] = fn;
};

// ==========================
// Internal
// ==========================

function _url2path ( base ) {
  return urlInfo => {
    if ( urlInfo.pathname ) {
      return Path.join( base, urlInfo.host, urlInfo.pathname );
    }
    return Path.join( base, urlInfo.host );
  };
}
