'use strict';

/**
 * @module Editor.Profile
 *
 * Profile module for operating profiles
 */
let Profile = {};
module.exports = Profile;

const Electron = require('electron');
const Fs = require('fire-fs');
const Path = require('fire-path');
const Console = require('./console');

let _path2profiles = {};
let _type2profilepath = {};

// ========================================
// exports
// ========================================

/**
 * @method load
 * @param {string} name - The name of the profile.
 * @param {string} type - The type of the profile, make sure you register the type via {@link Editor.Profile.register}.
 * @param {object} defaultProfile - The default profile to use if the profile is not found.
 * @return {object} A profile object with two additional function:
 *  - save: save the profile.
 *  - clear: clear all properties in the profile.
 * @see Editor.Profile.register
 *
 * Load profile via `name` and `type`, if no profile found, it will use the `defaultProfile` and save it to the disk.
 * You must register your profile path with `type` via {@link Editor.Profile.register} before you
 * can use it. The Editor Framework will search a profile under your register path with the `name`.
 *
 * @example
 * ```js
 * // register a project profile
 * Editor.Profile.register( 'project', '~/foo/bar');
 *
 * // load the profile at ~/foo/bar/foobar.json
 * let foobarProfile = Editor.loadProfile( 'foobar', 'project', {
 *   foo: 'foo',
 *   bar: 'bar',
 * });
 *
 * // change and save your profile
 * foobarProfile.foo = 'hello foo';
 * foobarProfile.save();
 * ```
 */
Profile.load = function ( name, type, defaultProfile ) {
  let path = _type2profilepath[type];
  if ( !path ) {
    Console.error( 'Failed to load profile by type %s, please register it first.', type );
    return null;
  }
  path = Path.join(path, name+'.json');

  let profile = _path2profiles[path];
  if ( profile ) {
    return profile;
  }

  let profileProto = {
    save () {
      _saveProfile( path, this );
    },

    update () {
      _loadProfile( path, this );
    },

    clear () {
      for ( let p in this ) {
        if ( p !== 'save' && p !== 'clear' && p !== 'update' ) {
          delete this[p];
        }
      }
    },
  };

  profile = defaultProfile || {};

  if ( !Fs.existsSync(path) ) {
    Fs.writeFileSync(path, JSON.stringify(profile, null, 2));
  } else {
    try {
      profile = JSON.parse(Fs.readFileSync(path));

      if ( defaultProfile ) {
        for ( let p in profile ) {
          if ( defaultProfile[p] === undefined ) {
            delete profile[p];
            Editor.warn(`Profile ${name}-${type} warning: delete unused profile field: ${p}`);
          }
        }

        for ( let p in defaultProfile ) {
          if (profile[p] === undefined ) {
            profile[p] = defaultProfile[p];
          } else if ( typeof(profile[p]) !== typeof(defaultProfile[p]) ) {
            profile[p] = defaultProfile[p];
            Editor.warn(`Profile ${name}-${type} warning: reset profile field: ${p}`);
          }
        }

        // save again
        Fs.writeFileSync(path, JSON.stringify(profile, null, 2));
      }
    } catch ( err ) {
      if ( err ) {
        Console.warn( 'Failed to load profile %s, error message: %s', name, err.message );
        profile = {};
      }
    }
  }

  profile = Object.assign(profile, profileProto);
  _path2profiles[path] = profile;

  return profile;
};


/**
 * @method register
 * @param {string} type - The type of the profile you want to register.
 * @param {string} path - The path for the register type.
 *
 * Register profile type with the path you provide.
 * {{#crossLink "Editor.loadProfile"}}{{/crossLink}}
 */
Profile.register = function ( type, path ) {
  _type2profilepath[type] = path;
};

/**
 * @method reset
 *
 * Reset the registered profiles
 */
Profile.reset = function () {
  _type2profilepath = {};
};

// ========================================
// Internal
// ========================================

function _saveProfile ( path, profile ) {
  let json = JSON.stringify(profile, null, 2);
  Fs.writeFileSync(path, json, 'utf8');
}

function _loadProfile ( path, profile ) {
  let jsonObj = JSON.parse(Fs.readFileSync(path));

  for ( let p in jsonObj ) {
    profile[p] = jsonObj[p];
  }
}

// ========================================
// Ipc
// ========================================

const ipcMain = Electron.ipcMain;

ipcMain.on('editor:load-profile', ( event, name, type ) => {
  let profile = Profile.load( name, type );
  event.reply(null,profile);
});

ipcMain.on('editor:save-profile', ( event, name, type, value ) => {
  let profile = Profile.load( name, type );
  if ( profile ) {
    profile.clear();
    Object.assign(profile, value);
    profile.save();
  }
});
