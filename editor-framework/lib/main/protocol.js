'use strict';

let Protocol = {};
module.exports = Protocol;

const Electron = require('electron');
const Url = require('fire-url');
const Path = require('fire-path');
const Fs = require('fire-fs');
const Console = require('./console');

let _defaultProtocols = [
  'http:',
  'https:',
  'ftp:',
  'ssh:',
  'file:',
];
let _protocol2fn = {};

// ========================================
// exports
// ========================================

// NOTE: only invoke this in app.on('ready')
Protocol.init = function (editorM) {
  const protocol = Electron.protocol;

  // native protocol register

  // register protocol editor-framework://
  protocol.registerFileProtocol('editor-framework', (request, cb) => {
    if ( !request.url ) {
      cb (-3); // ABORTED
      return;
    }

    let url = decodeURIComponent(request.url);
    let uri = Url.parse(url);

    let relativePath = uri.hostname;
    if ( uri.pathname ) {
      relativePath = Path.join( relativePath, uri.pathname );
    }

    let file = Path.join( editorM.frameworkPath, relativePath );
    cb ( { path: file } );
  }, err => {
    if ( err ) {
      editorM.failed( 'Failed to register protocol editor-framework, %s', err.message );
      return;
    }
    editorM.success( 'protocol editor-framework registered' );
  });

  // register protocol app://
  protocol.registerFileProtocol('app', (request, cb) => {
    if ( !request.url ) {
      cb (-3); // ABORTED
      return;
    }

    let url = decodeURIComponent(request.url);
    let uri = Url.parse(url);

    let relativePath = uri.hostname;
    if ( uri.pathname ) {
      relativePath = Path.join( relativePath, uri.pathname );
    }

    let file = Path.join( editorM.App.path, relativePath );
    cb ( { path: file } );
  }, err => {
    if ( err ) {
      editorM.failed( 'Failed to register protocol app, %s', err.message );
      return;
    }
    editorM.success( 'protocol app registered' );
  });

  // register protocol package://
  protocol.registerFileProtocol('packages', (request, cb) => {
    if ( !request.url ) {
      cb (-3); // ABORTED
      return;
    }

    let url = decodeURIComponent(request.url);
    let uri = Url.parse(url);

    let packagePath = editorM.Package.packagePath(uri.hostname);
    if ( !packagePath ) {
      return cb (-6); // net::ERR_FILE_NOT_FOUND
    }

    let packageInfo = editorM.Package.packageInfo(packagePath);
    if ( !packageInfo ) {
      return cb (-6); // net::ERR_FILE_NOT_FOUND
    }

    if ( uri.pathname.indexOf('/test') === 0 ) {
      return cb ({
        path: Path.join( packagePath, uri.pathname )
      });
    }

    return cb ({
      path: Path.join( packageInfo._destPath, uri.pathname )
    });
  }, err => {
    if ( err ) {
      editorM.failed( 'Failed to register protocol packages, %s', err.message );
      return;
    }
    editorM.success( 'protocol packages registered' );
  });

  // register protocol theme://
  protocol.registerFileProtocol('theme', (request, cb) => {
    if ( !request.url ) {
      cb (-3); // ABORTED
      return;
    }

    let url = decodeURIComponent(request.url);
    let uri = Url.parse(url);

    let relativePath = uri.hostname;
    if ( uri.pathname ) {
      relativePath = Path.join( relativePath, uri.pathname );
    }

    let file;
    for ( let i = 0; i < editorM.themePaths.length; ++i ) {
      let searchPath = Path.join(editorM.themePaths[i], editorM.theme);
      if ( Fs.isDirSync(searchPath) ) {
        file = Path.join( searchPath, relativePath );
        break;
      }
    }

    if ( !file ) {
      return cb (-6); // net::ERR_FILE_NOT_FOUND
    }

    cb ( { path: file } );
  }, err => {
    if ( err ) {
      editorM.failed( 'Failed to register protocol theme, %s', err.message );
      return;
    }
    editorM.success( 'protocol theme registered' );
  });

  function _url2path ( base ) {
    return uri => {
      if ( uri.pathname ) {
        return Path.join( base, uri.hostname, uri.pathname );
      }
      return Path.join( base, uri.hostname );
    };
  }

  function _packages2path ( uri ) {
    let packagePath = editorM.Package.packagePath(uri.hostname);
    if ( !packagePath ) {
      return '';
    }

    if ( uri.pathname ) {
      return Path.join( packagePath, uri.pathname );
    }
    return packagePath;
  }

  function _theme2path ( uri ) {
    let base;
    for ( let i = 0; i < editorM.themePaths.length; ++i ) {
      let searchPath = Path.join(editorM.themePaths[i], editorM.theme);
      if ( Fs.isDirSync(searchPath) ) {
        base = searchPath;
        break;
      }
    }

    if ( !base ) {
      return '';
    }

    if ( uri.pathname ) {
      return Path.join( base, uri.hostname, uri.pathname );
    }
    return Path.join( base, uri.hostname );
  }


  editorM.Protocol.register('editor-framework', _url2path(editorM.frameworkPath));
  editorM.Protocol.register('app', _url2path(editorM.App.path));
  editorM.Protocol.register('theme', _theme2path);
  editorM.Protocol.register('packages', _packages2path);
};

/**
 * @method url
 * @param {string} url
 *
 * Convert a url by its protocol to a filesystem path. This function is useful when you try to
 * get some internal file. You can use {@link Editor.Protocol.register} to register and map your filesystem
 * path to url. By default, Editor Framework register `editor-framework://` and `app://` protocol.
 *
 * @example
 * ```js
 * // it will return "{your-app-path}/foobar/foobar.js"
 * Editor.url('app://foobar/foobar.js');
 * ```
 */
Protocol.url = function ( url ) {
  let uri = Url.parse(url);

  if ( !uri.protocol ) {
    return url;
  }

  if ( _defaultProtocols.indexOf(uri.protocol) !== -1 ) {
    return url;
  }

  let fn = _protocol2fn[uri.protocol];
  if ( !fn ) {
    Console.error( `Failed to load url ${url}, please register the protocol for it.` );
    return null;
  }

  return fn(uri);
};

/**
 * @method register
 * @param {string} protocol
 * @param {function} fn
 *
 * Register a protocol so that {@link Editor.url} can use it to convert an url to the filesystem path.
 * The `fn` accept an url Object via [url.parse](https://nodejs.org/api/url.html#url_url_parse_urlstring_parsequerystring_slashesdenotehost)
 *
 * @example
 * ```js
 * const Path = require('path');
 *
 * let _url2path = base => {
 *   return uri => {
 *     if ( uri.pathname ) {
 *       return Path.join( base, uri.host, uri.pathname );
 *     }
 *     return Path.join( base, uri.host );
 *   };
 * };
 *
 * Editor.Protocol.register('editor-framework', _url2path(Editor.frameworkPath));
 * ```
 */
Protocol.register = function ( protocol, fn ) {
  _protocol2fn[protocol+':'] = fn;
};
