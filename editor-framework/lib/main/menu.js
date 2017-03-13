'use strict';

const Electron = require('electron');
const Path = require('fire-path');
const _ = require('lodash');

let _menus = {};
let _showDev = false;

/**
 * @class Editor.Menu
 * @constructor
 */

/**
 * @method Menu
 * @param {object[]|object} template - Menu template for initialize. The template take the options of
 * Electron's [Menu Item](http://electron.atom.io/docs/api/menu-item/)
 * @param {string} template.path - add a menu item by path.
 * @param {string} template.message - Ipc message name.
 * @param {string} template.command - A global function in main process (e.g. Editor.log ).
 * @param {array} template.params - The parameters passed through ipc.
 * @param {string} template.panel - The panelID, if specified, the message will send to panel.
 * @param {string} template.dev - Only show when Menu.showDev is true.
 * @param {object} [webContents] - A [WebContents](http://electron.atom.io/docs/api/web-contents/) object.
 * @return {Menu}
 */
class Menu {
  constructor ( template, webContents ) {
    if ( !template ) {
      this.nativeMenu = new Electron.Menu();
      return;
    }

    Menu.convert(template, webContents);
    this.nativeMenu = Electron.Menu.buildFromTemplate(template);
  }

  /**
   * @method dispose
   *
   * De-reference the native menu.
   */
  dispose () {
    this.nativeMenu = null;
  }

  /**
   * @method reset
   * @param {object[]|object} template
   *
   * Reset the menu from the template.
   */
  reset (template) {
    Menu.convert(template);
    this.nativeMenu = Electron.Menu.buildFromTemplate(template);
  }

  /**
   * @method clear
   *
   * Clear all menu item in it.
   */
  clear () {
    this.nativeMenu = new Electron.Menu();
  }

  /**
   * @method add
   * @param {string} path - A menu path
   * @param {object[]|object} template
   *
   * Build a template into menu item and add it to path
   *
   * @example
   * ```js
   * let editorMenu = new Editor.Menu();
   * editorMenu.add( 'foo/bar', {
   *   label: foobar,
   *   message: 'foobar:say',
   *   params: ['foobar: hello!']
   * });
   *
   * // you can also create menu without label
   * // it will add menu to foo/bar where bar is the menu-item
   * let editorMenu = new Editor.Menu();
   * editorMenu.add( 'foo/bar/foobar', {
   *   message: 'foobar:say',
   *   params: ['foobar: hello!']
   * });
   * ```
   */
  add ( path, template ) {
    // in object mode, we should set label from path if not exists
    if ( !Array.isArray(template) ) {
      if ( !template.label && template.type !== 'separator' ) {
        let start = path.lastIndexOf( '/' );
        if ( start !== -1 ) {
          template.label = path.slice( start + 1 );
          path = path.slice( 0, start );
        }
      }
    }

    let menuItem = _getMenuItem( this.nativeMenu, path, true );

    if ( !menuItem ) {
      Console.error(`Failed to find menu in path: ${path}` );
      return false;
    }

    if ( menuItem.type !== 'submenu' || !menuItem.submenu) {
      Console.error(`Failed to add menu at ${path}, it is not a submenu`);
      return false;
    }

    if ( !Array.isArray(template) ) {
      template = [template];
    }

    Menu.convert(template);
    let newSubMenu = Electron.Menu.buildFromTemplate(template);

    for ( let i = 0; i < newSubMenu.items.length; ++i ) {
      let newSubMenuItem = newSubMenu.items[i];

      let exists = menuItem.submenu.items.some(item => {
        return item.label === newSubMenuItem.label;
      });

      if ( exists ) {
        Console.error(
          `Failed to add menu to ${path},
          a menu item ${Path.posix.join( path, newSubMenuItem.label )} you tried to add already exists`
        );
        return false;
      }
    }

    for ( let i = 0; i < newSubMenu.items.length; ++i ) {
      let newSubMenuItem = newSubMenu.items[i];
      menuItem.submenu.append(newSubMenuItem);
    }

    return true;
  }

  /**
   * @method insert
   * @param {string} path - A menu path
   * @param {number} pos
   * @param {object[]|object} template
   *
   * Build a template into menu item and insert it to path at specific position
   */
  insert ( path, pos, template ) {
    // in object mode, we should set label from path if not exists
    if ( !Array.isArray(template) ) {
      if ( !template.label && template.type !== 'separator' ) {
        let start = path.lastIndexOf( '/' );
        if ( start !== -1 ) {
          template.label = path.slice( start + 1 );
          path = path.slice( 0, start );
        }
      }
    }

    // insert at root
    let parentPath = Path.dirname(path);
    if ( parentPath === '.' ) {
      if ( !Array.isArray(template) ) {
        template = [template];
      }

      Menu.convert(template);
      let newSubMenu = Electron.Menu.buildFromTemplate(template);

      let newMenuItem = new Electron.MenuItem({
        label: path,
        id: path.toLowerCase(),
        submenu: new Electron.Menu(),
        type: 'submenu',
      });
      for ( let i = 0; i < newSubMenu.items.length; ++i ) {
        let newSubMenuItem = newSubMenu.items[i];
        newMenuItem.submenu.append(newSubMenuItem);
      }

      this.nativeMenu.insert( pos, newMenuItem );

      return true;
    }

    // insert at path
    let name = Path.basename(path);
    let menuItem = _getMenuItem( this.nativeMenu, parentPath );

    if ( !menuItem ) {
      Console.error(`Failed to find menu in path: ${parentPath}` );
      return false;
    }

    if ( menuItem.type !== 'submenu' || !menuItem.submenu) {
      Console.error(`Failed to insert menu at ${parentPath}, it is not a submenu`);
      return false;
    }

    let exists = menuItem.submenu.items.some(item => {
      return item.label === name;
    });

    if ( exists ) {
      Console.error(
        `Failed to insert menu to ${path}, already exists`
      );
      return false;
    }

    if ( !Array.isArray(template) ) {
      template = [template];
    }

    Menu.convert(template);
    let newSubMenu = Electron.Menu.buildFromTemplate(template);

    let newMenuItem = new Electron.MenuItem({
      label: name,
      id: name.toLowerCase(),
      submenu: new Electron.Menu(),
      type: 'submenu',
    });
    for ( let i = 0; i < newSubMenu.items.length; ++i ) {
      let newSubMenuItem = newSubMenu.items[i];
      newMenuItem.submenu.append(newSubMenuItem);
    }

    menuItem.submenu.insert( pos, newMenuItem );

    return true;
  }

  /**
   * @method remove
   * @param {string} path - A menu path
   *
   * Remove menu item at path.
   */
  // base on electron#527 said, there is no simple way to remove menu item
  // https://github.com/atom/electron/issues/527
  remove ( path ) {
    let newMenu = new Electron.Menu();
    let removed = _cloneMenuExcept( newMenu, this.nativeMenu, path, '' );

    if ( !removed ) {
      Console.error(`Failed to remove menu in path: ${path} (could not be found)` );
      return false;
    }

    this.nativeMenu = newMenu;
    return true;
  }

  /**
   * @param {string} path - A menu path
   * @param {object[]|object} template
   *
   * Update menu item at path.
   */
  update ( path, template ) {
    let index = _getMenuItemIndex( this.nativeMenu, path );
    this.remove(path);
    return this.insert( path, index, template );
  }

  /**
   * @method set
   * @param {string} path - A menu path
   * @param {object} [options]
   * @param {NativeImage} [options.icon] - A [NativeImage](http://electron.atom.io/docs/api/native-image/)
   * @param {Boolean} [options.enabled]
   * @param {Boolean} [options.visible]
   * @param {Boolean} [options.checked] - NOTE: You must set your menu-item type to 'checkbox' to make it work
   *
   * Set menu options at path.
   */
  set ( path, options ) {
    let menuItem = _getMenuItem( this.nativeMenu, path, false );

    if ( !menuItem ) {
      // Console.error(`Failed to set menu in path ${path}: menu item not found`);
      return false;
    }

    if ( menuItem.type === 'separator' ) {
      Console.error(`Failed to set menu in path ${path}: menu item is a separator`);
      return false;
    }

    if ( options.icon !== undefined ) {
      menuItem.icon = options.icon;
    }

    if ( options.enabled !== undefined ) {
      menuItem.enabled = options.enabled;
    }

    if ( options.visible !== undefined ) {
      menuItem.visible = options.visible;
    }

    if ( options.checked !== undefined ) {
      menuItem.checked = options.checked;
    }

    return true;
  }

  static set showDev ( value ) { _showDev = value; }
  static get showDev () { return _showDev; }

  /**
   * @method convert
   * @param {object[]|object} template
   * @param {object} [webContents] - A [WebContents](http://electron.atom.io/docs/api/web-contents/) object.
   *
   * Convert the menu template to process additional keyword we added for Electron.
   * If webContents provided, the `template.message` will send to the target webContents.
   */
  static convert ( template, webContents ) {
    if ( !Array.isArray(template) ) {
      Console.error( 'template must be an array' );
      return;
    }

    for ( let i = 0; i < template.length; ++i ) {
      let remove = _convert(template, i, webContents);
      if ( remove ) {
        template.splice( i, 1 );
        --i;
      }
    }
  }

  /**
   * @method register
   * @static
   * @param {string} name - name of the register menu
   * @param {function} fn - a function returns the menu template
   * @param {boolean} [force] - force to register a menu even it was registered before.
   */
  static register ( name, fn, force ) {
    if ( typeof fn !== 'function' ) {
      Console.warn(`Cannot register menu ${name}, "fn" must be a function`);
      return;
    }

    if ( !force && _menus[name] ) {
      Console.warn(`Cannot register menu "${name}" (already exists).`);
      return;
    }

    _menus[name] = fn;
  }

  /**
   * @method unregister
   * @static
   * @param {string} name - name of the registerred menu
   */
  static unregister ( name ) {
    if ( !_menus[name] ) {
      Console.warn(`Cannot find menu "${name}"`);
      return;
    }

    delete _menus[name];
  }

  /**
   * @method getMenu
   * @static
   * @param {string} name - Name of the register menu
   */
  static getMenu ( name ) {
    let fn = _menus[name];
    if ( !fn ) {
      return [];
    }

    return fn();
  }

  /**
   * @method walk
   * @static
   * @param {object[]|object} template
   * @param {function} fn
   */
  static walk ( template, fn ) {
    if ( !Array.isArray(template) ) {
      template = [template];
    }

    template.forEach(item => {
      fn(item);
      if ( item.submenu ) {
        Menu.walk( item.submenu, fn );
      }
    });
  }
}

module.exports = Menu;

const Console = require('./console');
const Ipc = require('./ipc');

// ========================================
// Ipc
// ========================================

const ipcMain = Electron.ipcMain;

ipcMain.on('menu:popup', ( event, template, x, y ) => {
  // DISABLE: it is possible we sending the ipc from a window
  //          that don't register in Window
  // let win = Window.find(event.sender);
  // let win.popupMenu(template,x,y);

  if ( x !== undefined ) {
    x = Math.floor(x);
  }

  if ( y !== undefined ) {
    y = Math.floor(y);
  }

  let editorMenu = new Menu( template, event.sender );
  editorMenu.nativeMenu.popup(Electron.BrowserWindow.fromWebContents(event.sender), x, y);
  editorMenu.dispose();
});

ipcMain.on('menu:register', ( event, name, tmpl, force ) => {
  Menu.register( name, () => {
    return JSON.parse(JSON.stringify(tmpl));
  }, force );
});

// ========================================
// Internal
// ========================================

function _expandMenuTemplate ( tmpl, index ) {
  //
  let itemTmpl = tmpl[index];
  if ( !itemTmpl.path ) {
    return;
  }

  //
  let pathNames = itemTmpl.path.split('/');
  if ( pathNames.length === 1 ) {
    tmpl[index].label = pathNames[0];
    return false;
  }

  //
  let submenu = tmpl;
  let parentTmpl = null;
  let curPath = '';
  let removeOriginal = false;

  for ( let i = 0; i < pathNames.length-1; i++ ) {
    let isLastOne = i === pathNames.length-2;
    let name = pathNames[i];

    curPath = Path.posix.join( curPath, name );

    // find menu item
    parentTmpl = null;
    let idx = _.findIndex(submenu, item => {
      return item.label === name;
    });
    if ( idx !== -1 ) {
      parentTmpl = submenu[idx];
    }

    // create menu template if not found
    if (!parentTmpl) {
      parentTmpl = {
        label: name,
        type: 'submenu',
        submenu: [],
      };

      // if this is first path, we just replace the old template
      if ( i === 0 ) {
        submenu[index] = parentTmpl;
      } else {
        submenu.push(parentTmpl);
      }
    } else {
      if ( i === 0 ) {
        removeOriginal = true;
      }
    }

    if ( !parentTmpl.submenu || parentTmpl.type !== 'submenu' ) {
      Console.warn( `Cannot add menu in ${itemTmpl.path}, the ${curPath} is already used` );
      return;
    }

    if ( isLastOne ) {
      break;
    }

    submenu = parentTmpl.submenu;
  }

  //
  itemTmpl.label = pathNames[pathNames.length-1];
  parentTmpl.submenu.push(itemTmpl);

  return removeOriginal;
}

function _getMenuItemIndex ( nativeMenu, path ) {
  let nextMenu = nativeMenu;
  let pathNames = path.split('/');
  let curPath = '';

  for (let i = 0; i < pathNames.length; i++) {
    let isLastOne = i === pathNames.length - 1;
    let name = pathNames[i];
    let menuItem = null;

    curPath = Path.posix.join( curPath, name );

    // find menu item
    let index = _.findIndex( nextMenu.items, item => {
      return item.label === name;
    });
    if ( index !== -1 ) {
      menuItem = nextMenu.items[index];
    }

    //
    if (menuItem) {
      if (isLastOne) {
        return index;
      }

      if ( !menuItem.submenu || menuItem.type !== 'submenu' ) {
        return -1;
      }

      nextMenu = menuItem.submenu;
      continue;
    }

    //
    return -1;
  }

  return -1;
}

function _getMenuItem ( nativeMenu, path, createIfNotExists ) {
  let nextMenu = nativeMenu;
  if ( typeof createIfNotExists !== 'boolean' ) {
    createIfNotExists = false;
  }

  let pathNames = path.split('/');
  let curPath = '';

  for (let i = 0; i < pathNames.length; i++) {
    let isLastOne = i === pathNames.length - 1;
    let name = pathNames[i];
    let menuItem = null;

    curPath = Path.posix.join( curPath, name );

    // find menu item
    let index = _.findIndex( nextMenu.items, item => {
      return item.label === name;
    });
    if ( index !== -1 ) {
      menuItem = nextMenu.items[index];
    }

    //
    if (menuItem) {
      if (isLastOne) {
        return menuItem;
      }

      if ( !menuItem.submenu || menuItem.type !== 'submenu' ) {
        Console.warn( `Cannot add menu in ${path}, the ${curPath} is already used` );
        return null;
      }

      nextMenu = menuItem.submenu;
      continue;
    }

    //
    if ( createIfNotExists ) {
      menuItem = new Electron.MenuItem({
        label: name,
        id: name.toLowerCase(),
        submenu: new Electron.Menu(),
        type: 'submenu',
      });

      // if this is the first one
      if ( i === 0 ) {
        // HACK: we assume last menuItem always be 'Help'
        // let pos = Math.max( nextMenu.items.length, 0 );
        let pos = Math.max( nextMenu.items.length-1, 0 );
        nextMenu.insert(pos,menuItem);
      } else {
        nextMenu.append(menuItem);
      }

      if ( isLastOne ) {
        return menuItem;
      }

      nextMenu = menuItem.submenu;
      continue;
    }

    //
    return null;
  }

  return null;
}

function _cloneMenuItemLevel1 ( menuItem ) {
  let options = _.pick(menuItem, [
    'click',
    'role',
    'type',
    'label',
    'sublabel',
    'accelerator',
    'icon',
    'enabled',
    'visible',
    'checked',
    // 'submenu', // NOTE: never clone submenu, other wise we can't change item inside it
    'id',
    'position',
  ]);

  if ( options.type === 'submenu' ) {
    options.submenu = new Electron.Menu();
  }

  return new Electron.MenuItem(options);
}

function _cloneMenuExcept ( newMenu, nativeMenu, exceptPath, curPath ) {
  let found = false;

  for ( let i = 0; i < nativeMenu.items.length; ++i ) {
    let menuItem = nativeMenu.items[i];
    let path = Path.posix.join( curPath, menuItem.label );

    if ( !Path.contains( path, exceptPath ) ) {
      newMenu.append(menuItem);
      continue;
    }

    if ( path === exceptPath ) {
      found = true;
      continue;
    }

    let newMenuItem = _cloneMenuItemLevel1(menuItem);
    if ( newMenuItem.type !== 'submenu' ) {
      newMenu.append(newMenuItem);
      continue;
    }

    let result = _cloneMenuExcept(
      newMenuItem.submenu,
      menuItem.submenu,
      exceptPath,
      path
    );

    if ( result ) {
      found = true;
    }

    if ( newMenuItem.submenu.items.length > 0 ) {
      newMenu.append(newMenuItem);
    }
  }

  return found;
}

function _convert ( submenuTmpl, index, webContents ) {
  let template = submenuTmpl[index];
  let itemName = template.path || template.label;

  // remove the template if it is dev and we are not in dev mode
  if ( template.dev && _showDev === false ) {
    return true;
  }

  // parse message
  if ( template.message ) {
    // make sure message and click not used together
    if ( template.click ) {
      Console.error(
        `Skip 'click' in menu item '${itemName}', already has 'message'`
      );
    }

    // make sure message and command not used together
    if ( template.command ) {
      Console.error(
        `Skip 'command' in menu item '${itemName}', already has 'message'`
      );
    }

    let args = [template.message];

    // parse params
    if ( template.params ) {
      if ( !Array.isArray(template.params) ) {
        Console.error(
          `Failed to add menu item '${itemName}', 'params' must be an array`
        );
        // return true to remote the menu item
        return true;
      }
      args = args.concat(template.params);
    }

    // parse panel
    if ( template.panel ) {
      args.unshift(template.panel);
    }

    // parse click
    // NOTE: response in next tick to prevent ipc blocking issue caused by atom-shell's menu.
    if ( template.panel ) {
      template.click = () => {
        setImmediate(() => {
          Ipc.sendToPanel.apply(null, args);
        });
      };
    } else if ( webContents ) {
      template.click = () => {
        setImmediate(() => {
          webContents.send.apply(webContents, args);
        });
      };
    } else {
      template.click = () => {
        setImmediate(() => {
          Ipc.sendToMain.apply(null, args);
        });
      };
    }

  }
  // parse command
  else if ( template.command ) {
    // make sure command and click not used together
    if ( template.click ) {
      Console.error(
        `Skipping "click" action in menu item '${itemName}' since it's already mapped to a command.`
      );
    }

    // get global function
    let fn = _.get(global, template.command, null);

    if ( !fn || typeof fn !== 'function' ) {
      Console.error(
        `Failed to add menu item '${itemName}', cannot find global function ${template.command} in main process for 'command'.`
      );
      // return true to remote the menu item
      return true;
    }

    let args = [];

    if (template.params) {
      if ( !Array.isArray(template.params) ) {
        Console.error('message parameters must be an array');
        return;
      }
      args = args.concat(template.params);
    }

    template.click = () => {
      fn.apply(null, args);
    };
  }
  // parse submenu
  else if ( template.submenu ) {
    Menu.convert(template.submenu, webContents);
  }

  let removeOriginal = false;

  // check label
  if ( template.path ) {
    // make sure path and label not used together
    if ( template.label ) {
      Console.warn(`Skipping label "${template.label}" in menu item "${template.path}"`);
    }

    removeOriginal = _expandMenuTemplate( submenuTmpl, index );
  } else {
    if ( template.label === undefined && template.type !== 'separator' ) {
      Console.warn('Missing label for menu item');
    }
  }

  return removeOriginal;
}
