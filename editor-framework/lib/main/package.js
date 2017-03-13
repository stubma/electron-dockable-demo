'use strict';

/**
 * @module Editor.Package
 *
 * Package module for manipulating packages
 */
let Package = {};
module.exports = Package;

// requires
const Electron = require('electron');
const Path = require('fire-path');
const Fs = require('fire-fs');

const Async = require('async');
const Semver = require('semver');
const _ = require('lodash');

const Console = require('./console');
const MainMenu = require('./main-menu');
const Ipc = require('./ipc');
const App = require('./app');
const i18n = require('./i18n');
const IpcListener = require('../share/ipc-listener');

//
let _lang = 'en';
let _versions = {};
let _path2package = {};
let _name2packagePath = {};
let _panel2info = {};
let _packageSearchPaths = [];

// ========================================
// exports
// ========================================

/**
 * @method load
 * @param {string} path - An absolute path point to a package folder
 * @param {object} [opts] - Options
 * @param {boolean} opts.build - Force rebuild the packages
 * @param {function} cb - Callback when finish loading
 *
 * Load a package at path
 */
Package.load = function ( path, opts, cb ) {
  opts = opts || {};

  if ( typeof opts === 'function' ) {
    cb = opts;
    opts = {};
  }

  if ( _path2package[path] ) {
    if ( cb ) cb ();
    return;
  }

  let pjsonPath = Path.join( path, 'package.json' );
  let pjsonObj;
  try {
    pjsonObj = JSON.parse(Fs.readFileSync(pjsonPath));
  } catch (err) {
    if ( cb ) {
      cb ( new Error( `Failed to load 'package.json': ${err.message}` ) );
    }
    return;
  }

  // check host, if we don't have the host, skip load it
  for ( let host in pjsonObj.hosts ) {
    let currentVer = _versions[host];
    if ( !currentVer ) {
      if ( cb ) {
        cb ( new Error( `Host '${host}' does not exist.` ) );
      }
      return;
    }

    let requireVer = pjsonObj.hosts[host];
    if ( !Semver.satisfies( currentVer, requireVer ) ) {
      if ( cb ) {
        cb ( new Error( `Host '${host}' require ver ${requireVer}` ) );
      }
      return;
    }
  }

  //
  Async.series([
    // check dependencied
    next => {
      let pkgdeps = pjsonObj.packages;

      // TEMP: backwards compat
      if ( pjsonObj.pkgDependencies ) {
        Console.warn(`Package ${pjsonObj.name} parse warning: "pkgDependencies" is deprecated, use "packages" instead.`);
        pkgdeps = pjsonObj.pkgDependencies;
      }

      if ( !pkgdeps ) {
        next ();
        return;
      }

      Async.eachSeries(Object.keys(pkgdeps), (pkgName, done) => {
        let pkgPath = Package.find( pkgName );
        if ( !pkgPath ) {
          return done ( new Error(`Cannot find dependent package ${pkgName}`) );
        }

        Package.load( pkgPath, done );
      }, next);
    },

    // build
    next => {
      pjsonObj._path = path;
      _build ( pjsonObj, opts.build, ( err, destPath ) => {
        if ( err ) {
          next ( new Error( `Building failed: ${err.message}` ) );
          return;
        }

        pjsonObj._destPath = destPath;
        next ();
      });
    },

    // parsing
    next => {
      // register i18n from i18n/${lang}.js
      let i18nFile = Path.join( pjsonObj._destPath, 'i18n', `${_lang}.js` );
      if ( Fs.existsSync(i18nFile) ) {
        try {
          i18n.extend({
            [pjsonObj.name]: require(i18nFile),
          });
        } catch (e) {
          next ( new Error( `Failed to load ${i18nFile}: ${e.stack}` ) );
          return;
        }
      }

      let main = null;

      // load main.js
      // NOTE: it is possible for a package that does not have main-process code
      if ( pjsonObj.main ) {
        let mainPath = Path.join( pjsonObj._destPath, pjsonObj.main );
        try {
          main = require(mainPath);
        } catch (e) {
          next ( new Error( `Failed to load ${pjsonObj.main}: ${e.stack}` ) );
          return;
        }
      }

      // register main ipc messages
      if ( main ) {
        let ipcListener = new IpcListener();
        for ( let prop in main.messages ) {
          let fn = main.messages[prop];
          if ( typeof fn === 'function' ) {
            ipcListener.on( _messageName(pjsonObj.name,prop), fn.bind(main) );
          }
        }
        pjsonObj._ipc = ipcListener;
      }

      // register main-menu
      let mainMenuInfo = pjsonObj['main-menu'];
      if ( mainMenuInfo && typeof mainMenuInfo === 'object' ) {
        for ( let menuPath in mainMenuInfo ) {
          let fmtMenuPath = i18n.formatPath(menuPath);

          let parentMenuPath = Path.dirname(fmtMenuPath);
          if ( parentMenuPath === '.' ) {
            Console.failed(`Failed to add menu ${fmtMenuPath}`);
            continue;
          }

          let menuOpts = mainMenuInfo[menuPath];
          let template = Object.assign({
            label: Path.basename(fmtMenuPath),
          }, menuOpts);

          // create NativeImage for icon
          if ( menuOpts.icon ) {
            let icon = Electron.nativeImage.createFromPath( Path.join(pjsonObj._destPath, menuOpts.icon) );
            template.icon = icon;
          }

          MainMenu.add( parentMenuPath, template );
        }
      }

      // register panels
      // TEMP: backwards compat
      let panels = pjsonObj;
      let backwards = false;
      if ( pjsonObj.panels ) {
        Console.warn(`
           Package ${pjsonObj.name} parse warning: "panels" is deprecated, use "panel" instead.
           For multiple panel, use "panel.x", "panel.y" as your register field.
           NOTE: Don't forget to change your "Editor.Ipc.sendToPanel" message, since your panelID has changed.
        `);
        panels = pjsonObj.panels;
        backwards = true;
      }

      for ( let name in panels ) {
        let panelID;

        if ( backwards ) {
          panelID = `${pjsonObj.name}.${name}`;
        } else {
          // if the name is not start with panel, skip it
          if ( name.indexOf('panel') !== 0 ) {
            continue;
          }
          panelID = name.replace(/^panel/, pjsonObj.name);
        }

        if ( _panel2info[panelID] ) {
          Console.failed( `Failed to load panel "${name}" from "${pjsonObj.name}", the panelID ${panelID} already exists` );
          continue;
        }

        // setup default properties
        let panelInfo = panels[name];
        _.defaults(panelInfo, {
          path: pjsonObj._destPath,
          type: 'dockable',
          title: panelID,
          popable: true,
          'shadow-dom': true,
          frame: true,
          resizable: true,
        });

        // check panel info
        if ( !panelInfo.main ) {
          Console.failed( `Failed to load panel "${name}" from "${pjsonObj.name}", "main" field not found.` );
          continue;
        }

        if ( !Fs.existsSync(Path.join(path,panelInfo.main)) ) {
          Console.failed( `Failed to load panel "${name}" from "${pjsonObj.name}", main file "${panelInfo.main}" not found.` );
          continue;
        }

        //
        _panel2info[panelID] = panelInfo;
      }

      //
      _path2package[path] = pjsonObj;
      _name2packagePath[pjsonObj.name] = path;

      // invoke main.load
      if ( main && main.load ) {
        try {
          main.load();
        } catch (e) {
          Package.unload(path, () => {
            next ( new Error( `Failed to execute load() function: ${e.stack}` ) );
          });
          return;
        }
      }

      //
      next ();
    },

    // custom load
    next => {
      if ( App.loadPackage ) {
        App.loadPackage(pjsonObj, next);
        return;
      }

      next ();
    },

    // loaded
    next => {
      Console.success( `${pjsonObj.name} loaded` );
      Ipc.sendToWins('editor:package-loaded', pjsonObj.name);
      next ();
    },

  ], cb);
};

/**
 * @method unload
 * @param {string} path - An absolute path point to a package folder
 * @param {function} cb - Callback when finish unloading
 *
 * Unload a package at path
 */
Package.unload = function ( path, cb ) {
  let pjsonObj = _path2package[path];
  if ( !pjsonObj ) {
    if ( cb ) {
      cb ();
    }
    return;
  }

  // unregister i18n table
  i18n.unset([pjsonObj.name]);

  // unregister panel
  // TEMP: backwards compat
  let panels = pjsonObj;
  let backwards = false;
  if ( pjsonObj.panels ) {
    panels = pjsonObj.panels;
    backwards = true;
  }
  for ( let name in panels ) {
    let panelID;

    if ( backwards ) {
      panelID = `${pjsonObj.name}.${name}`;
    } else {
      // if the name is not start with panel, skip it
      if ( name.indexOf('panel') !== 0 ) {
        continue;
      }
      panelID = name.replace(/^panel/, pjsonObj.name);
    }

    delete _panel2info[panelID];
  }

  // unregister main menu
  let mainMenuInfo = pjsonObj['main-menu'];
  if ( mainMenuInfo && typeof mainMenuInfo === 'object' ) {
    for ( let menuPath in mainMenuInfo ) {
      let fmtMenuPath = i18n.formatPath(menuPath);
      MainMenu.remove( fmtMenuPath );
    }
  }

  // unregister main ipc messages
  if ( pjsonObj._ipc ) {
    pjsonObj._ipc.clear();
  }

  // uncache main.js
  if ( pjsonObj.main ) {
    let cache = require.cache;
    let mainPath = Path.join( pjsonObj._destPath, pjsonObj.main );
    let cachedModule = cache[mainPath];

    // invoke main.unload()
    if ( cachedModule ) {
      let main = cachedModule.exports;
      if ( main && main.unload ) {
        try {
          main.unload();
        } catch (err) {
          Console.failed( `Failed to unload "${pjsonObj.main}" from "${pjsonObj.name}": ${err.stack}.` );
        }
      }

      _clearDependence( pjsonObj._destPath, cachedModule.children );
      delete cache[mainPath];
    } else {
      Console.failed( `Failed to uncache module ${pjsonObj.main}: Cannot find it.` );
    }
  }

  //
  if ( App.unloadPackage ) {
    App.unloadPackage(pjsonObj);
  }

  //
  delete _path2package[path];
  delete _name2packagePath[pjsonObj.name];
  Console.success( `${pjsonObj.name} unloaded` );
  Ipc.sendToWins('editor:package-unloaded', pjsonObj.name);

  if ( cb ) {
    cb ();
  }
};

/**
 * @method reload
 * @param {string} path - An absolute path point to a package folder
 * @param {object} opts - Options
 * @param {Boolean} opts.rebuild - If rebuild the project
 * @param {function} cb - Callback when finish reloading
 *
 * Reload a package at path
 */
Package.reload = function ( path, opts, cb ) {
  opts = opts || {};
  let rebuild = (typeof opts.rebuild === 'boolean') ? opts.rebuild : true;

  Async.series([
    next => {
      let pjsonObj = _path2package[path];
      if ( !pjsonObj ) {
        next ();
        return;
      }

      if ( rebuild && pjsonObj.build ) {
        Console.log( 'Rebuilding ' + pjsonObj.name );
        Package.build( path, next );
        return;
      }

      next ();
    },

    next => {
      Package.unload(path, next);
    },

    next => {
      Package.load(path, next);
    },
  ], err => {
    if (cb) {
      cb ( err );
    }
  });
};

/**
 * @method panelInfo
 * @param {string} panelID
 * @return {object}
 *
 * Find and get panel info via panelID, the panel info is the json object
 * that defined in `panels.{panel-name}` in your package.json
 */
Package.panelInfo = function ( panelID ) {
  return _panel2info[panelID];
};

/**
 * @method packageInfo
 * @param {string} path - The path can be any files in this package
 * @return {object}
 *
 * Find and get package info via path, the package info is the json object of your package.json file
 */
Package.packageInfo = function ( path ) {
  for ( var p in _path2package ) {
    if ( Path.contains( p, path )  ) {
      return _path2package[p];
    }
  }
  return null;
};

/**
 * @method packagePath
 * @param {string} packageName
 * @return {string}
 *
 * Return the path of the package by name
 */
Package.packagePath = function ( packageName ) {
  return _name2packagePath[packageName];
};

/**
 * @method build
 * @param {string} path
 * @param {function} callback
 * @return {string}
 *
 * Build package at path
 */
Package.build = function ( path, cb ) {
  const BuildPackage = require('./build-package');
  BuildPackage.start({
    path: path,
    minify: false,
    babel: false,
  }, err => {
    if ( err ) {
      Console.error(`Failed to build package at ${path}, ${err.message}`);
      if ( cb ) cb ( err );
      return;
    }

    if ( cb ) cb ( null, Path.join(path, 'bin/dev') );
  });
};

/**
 * @method addPath
 * @param {string|array} path
 *
 * Add package search path
 */
Package.addPath = function ( path ) {
  if ( !Array.isArray(path) ) {
    path = [path];
  }

  _packageSearchPaths = _.union( _packageSearchPaths, path );
};

/**
 * @method removePath
 * @param {string} path
 *
 * Remove search path from package search path list
 */
Package.removePath = function ( path ) {
  let idx = _packageSearchPaths.indexOf(path);
  if ( idx !== -1 ) {
    _packageSearchPaths.splice(idx,1);
  }
};

/**
 * @method resetPath
 *
 * Reset path
 */
Package.resetPath = function () {
  _packageSearchPaths = [];
};

/**
 * @method find
 * @param {string} name - package name
 * @return {string} - package path
 *
 * Find package by name in package search path list
 */
Package.find = function ( name ) {
  for ( let i = 0; i < _packageSearchPaths.length; ++i ) {
    let searchPath = _packageSearchPaths[i];
    if ( Fs.isDirSync(searchPath) ) {
      let list = Fs.readdirSync( searchPath );
      if ( list.indexOf(name) !== -1 ) {
        return Path.join( searchPath, name );
      }
    }
  }

  return null;
};

/**
 * @property {array} paths
 *
 * Return package search path list
 */
Object.defineProperty(Package, 'paths', {
  enumerable: true,
  get() {
    return _packageSearchPaths.slice();
  }
});

/**
 * @property {string} lang
 *
 * Return current language setting
 */
Object.defineProperty(Package, 'lang', {
  enumerable: true,
  set(value) {
    _lang = value;
  },
  get() {
    return _lang;
  }
});

/**
 * @property {array} paths
 *
 * Return the version of sub modules
 */
Object.defineProperty(Package, 'versions', {
  enumerable: true,
  set(value) {
    _versions = value;
  },
  get() {
    return _versions;
  }
});

// ========================================
// Internal
// ========================================

function _messageName ( packageName, messageName ) {
  if ( messageName.indexOf(':') === -1 ) {
    return `${packageName}:${messageName}`;
  }
  return messageName;
}

function _build ( pjsonObj, force, cb ) {
  if ( !pjsonObj.build ) {
    if ( cb ) {
      cb ( null, pjsonObj._path );
    }

    return;
  }

  if ( !force ) {
    // check if bin/dev exists
    let binPath = Path.join( pjsonObj._path, 'bin/dev' );
    if ( Fs.existsSync(binPath) ) {
      let pjsonPath = Path.join( binPath, 'package.json');

      if (  Fs.existsSync(pjsonPath)  ) {
        // check if bin/dev/package.json have the same version
        let binPackageObj = JSON.parse(Fs.readFileSync(pjsonPath));

        if ( pjsonObj.version === binPackageObj.version ) {
          if ( cb ) {
            cb ( null, binPath );
          }

          return;
        }
      }
    }
  }

  Console.log( 'Building ' + pjsonObj.name );
  Package.build( pjsonObj._path, cb );
}

function _clearDependence(path, deps) {
  if ( !path ) {
    return;
  }

  let childDeps = [];
  deps.forEach(dep => {
    let file = dep.filename;
    // file: ./builtin/a/core/menu.js
    // path: ./builtin/a
    if ( file.indexOf(path) === 0 ) {
      // Internal file
      dep.children.forEach(item => {
        childDeps.push(item);
      });
      delete require.cache[file];
    }
  });

  if ( childDeps.length > 0 ) {
    _clearDependence( path, childDeps );
  }
}

// ========================================
// Ipc
// ========================================

const ipcMain = Electron.ipcMain;

ipcMain.on('editor:package-query-infos', (event) => {
  let builtinPath = Path.join( App.path, 'builtin' );
  let results = [];

  for ( let path in _path2package ) {
    results.push({
      path: path,
      builtin: Path.contains( builtinPath, path ),
      enabled: true, // TODO:
      info: _path2package[path],
    });
  }

  event.reply(null,results);
});

ipcMain.on('editor:package-query-info', (event, name) => {
  let path = _name2packagePath[name];
  path = path ? path : '';

  let info = _path2package[path];
  let builtinPath = Path.join( App.path, 'builtin' );

  event.reply(null, {
    path: path,
    builtin: Path.contains( builtinPath, path ),
    enabled: true, // TODO:
    info: info,
  });
});

ipcMain.on('editor:package-reload', (event, name) => {
  let path = _name2packagePath[name];
  if ( !path ) {
    Console.error(`Failed to reload package ${name}, not found`);
    return;
  }

  Package.reload(path);
});
