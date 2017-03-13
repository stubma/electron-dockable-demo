'use strict';

/**
 * @module Editor.MainMenu
 *
 * The main menu module for manipulating main menu items
 */
let MainMenu = {};
module.exports = MainMenu;

// requires
const Electron = require('electron');
const Fs = require('fire-fs');

const Ipc = require('./ipc');
const Window = require('./window');
const Menu = require('./menu');
const Debugger = require('./debugger');
const i18n = require('./i18n');
const Platform = require('../share/platform');

const _T = i18n.t;
let _mainMenu;

// ========================================
// exports
// ========================================

/**
 * @method init
 *
 * Init main menu
 */
MainMenu.init = function () {
  if ( !_mainMenu ) {
    _mainMenu = new Menu(_builtinMainMenu());
  }

  let menuTmpl = Menu.getMenu('main-menu');
  if ( !menuTmpl ) {
    Menu.register('main-menu', _builtinMainMenu);
    menuTmpl = Menu.getMenu('main-menu');
  }

  _mainMenu.reset(menuTmpl);
  MainMenu.apply();
};

/**
 * @method apply
 *
 * Apply main menu changes
 */
MainMenu.apply = function () {
  Electron.Menu.setApplicationMenu(_mainMenu.nativeMenu);
};

/**
 * @method add
 * @param {string} path - A menu path
 * @param {object[]|object} - template
 *
 * Build a template into menu item and add it to path
 */
MainMenu.add = function ( path, template ) {
  if ( _mainMenu.add( path, template ) ) {
    MainMenu.apply();
  }
};

/**
 * @method update
 * @param {string} path - A menu path
 * @param {object[]|object} - template
 *
 * Build a template into menu item and update it at path
 */
MainMenu.update = function ( path, template ) {
  if ( _mainMenu.update( path, template ) ) {
    MainMenu.apply();
  }
};

/**
 * @method remove
 * @param {string} path - A menu path
 *
 * Remove menu item at path.
 */
MainMenu.remove = function ( path ) {
  if ( _mainMenu.remove( path ) ) {
    MainMenu.apply();
  }
};

/**
 * Revert to builtin main-menu
 */
MainMenu._resetToBuiltin = function () {
  Menu.register('main-menu', _builtinMainMenu, true);
  MainMenu.init();
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
 * Set options of a menu item at path.
 */
MainMenu.set = function ( path, options ) {
  if ( _mainMenu.set( path, options ) ) {
    MainMenu.apply();
  }
};

/**
 * @property menu
 *
 * Get main menu instance for debug purpose
 */
Object.defineProperty(MainMenu, 'menu', {
  enumerable: true,
  get () { return _mainMenu; },
});

// ========================================
// Internal
// ========================================

function _builtinMainMenu () {
  return [
    // Help
    {
      label: _T('MAIN_MENU.help.title'),
      role: 'help',
      id: 'help',
      submenu: [
        {
          label: _T('MAIN_MENU.help.docs'),
          click () {
            // TODO
            // let helpWin = require('../../share/manual');
            // helpWin.openManual();
          }
        },
        {
          label: _T('MAIN_MENU.help.api'),
          click () {
            // TODO
            // let helpWin = require('../../share/manual');
            // helpWin.openAPI();
          }
        },
        {
          label: _T('MAIN_MENU.help.forum'),
          click () {
            // TODO
            // Shell.openExternal('http://cocos-creator.com/chat');
            // Shell.beep();
          }
        },
        { type: 'separator' },
        {
          label: _T('MAIN_MENU.help.subscribe'),
          click () {
            // TODO
            // Shell.openExternal('http://eepurl.com/bh5w3z');
            // Shell.beep();
          }
        },
        { type: 'separator' },
      ]
    },

    // editor-framework
    {
      label: _T('SHARED.product_name'),
      position: 'before=help',
      submenu: [
        {
          label: _T('MAIN_MENU.about', {
            product: _T('SHARED.product_name')
          }),
          role: 'about',
        },
        {
          label: _T('MAIN_MENU.window.hide', {
            product: _T('SHARED.product_name')
          }),
          accelerator: 'CmdOrCtrl+H',
          role: 'hide'
        },
        {
          label: _T('MAIN_MENU.window.hide_others'),
          accelerator: 'CmdOrCtrl+Shift+H',
          role: 'hideothers'
        },
        {
          label: _T('MAIN_MENU.window.show_all'),
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          role: 'quit',
        },
      ]
    },

    // Edit
    {
      label: _T('MAIN_MENU.edit.title'),
      submenu: [
        {
          label: _T('MAIN_MENU.edit.undo'),
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo'
        },
        {
          label: _T('MAIN_MENU.edit.redo'),
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo'
        },
        { type: 'separator' },
        {
          label: _T('MAIN_MENU.edit.cut'),
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: _T('MAIN_MENU.edit.copy'),
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: _T('MAIN_MENU.edit.paste'),
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: _T('MAIN_MENU.edit.selectall'),
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall'
        },
      ]
    },

    // Window
    {
      label: 'Window',
      id: 'window',
      role: 'window',
      submenu: [
        {
          label: _T('MAIN_MENU.window.hide', {product: _T('SHARED.product_name')}),
          accelerator: 'CmdOrCtrl+H',
          visible: Platform.isDarwin,
          role: 'hide'
        },
        {
          label: _T('MAIN_MENU.window.hide_others'),
          accelerator: 'CmdOrCtrl+Shift+H',
          visible: Platform.isDarwin,
          role: 'hideothers'
        },
        {
          label: _T('MAIN_MENU.window.show_all'),
          role: 'unhide',
          visible: Platform.isDarwin
        },
        {
          label: _T('MAIN_MENU.window.minimize'),
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize',
        },
        {
          label: _T('MAIN_MENU.window.bring_all_front'),
          visible: Platform.isDarwin,
          role: 'front',
        },
        { type: 'separator' },
        {
          label: _T('MAIN_MENU.window.close'),
          accelerator: 'CmdOrCtrl+W',
          role: 'close',
        },
      ]
    },

    // Panel
    {
      label: 'Panel',
      id: 'panel',
      submenu: [
      ]
    },

    // Layout
    {
      label: _T('MAIN_MENU.layout.title'),
      id: 'layout',
      submenu: [
        {
          label: _T('MAIN_MENU.layout.default'),
          click () {
            let layoutInfo = JSON.parse(
              Fs.readFileSync(
                Editor.url(Window.defaultLayout)
              )
            );
            Ipc.sendToMainWin( 'editor:reset-layout', layoutInfo);
          }
        },
        {
          label: _T('MAIN_MENU.layout.empty'),
          dev: true,
          click () {
            Ipc.sendToMainWin('editor:reset-layout', null);
          }
        },
      ]
    },

    // Developer
    {
      label: _T('MAIN_MENU.developer.title'),
      id: 'developer',
      submenu: [
        {
          label: _T('MAIN_MENU.developer.reload'),
          accelerator: 'CmdOrCtrl+R',
          click ( item, focusedWindow ) {
            // DISABLE: Console.clearLog();
            focusedWindow.webContents.reload();
          }
        },
        {
          label: _T('MAIN_MENU.developer.reload_no_cache'),
          accelerator: 'CmdOrCtrl+Shift+R',
          click ( item, focusedWindow ) {
            // DISABLE: Console.clearLog();
            focusedWindow.webContents.reloadIgnoringCache();
          }
        },
        { type: 'separator' },
        {
          label: _T('MAIN_MENU.developer.inspect'),
          accelerator: 'CmdOrCtrl+Shift+C',
          click () {
            let nativeWin = Electron.BrowserWindow.getFocusedWindow();
            let editorWin = Window.find(nativeWin);
            if ( editorWin ) {
              editorWin.send( 'editor:window-inspect' );
            }
          }
        },
        {
          label: _T('MAIN_MENU.developer.devtools'),
          accelerator: (() => {
            if (process.platform === 'darwin') {
              return 'Alt+Command+I';
            } else {
              return 'Ctrl+Shift+I';
            }
          })(),
          click ( item, focusedWindow ) {
            if ( focusedWindow ) {
              focusedWindow.openDevTools();
              if ( focusedWindow.devToolsWebContents ) {
                focusedWindow.devToolsWebContents.focus();
              }
            }
          }
        },
        {
          label: _T('MAIN_MENU.developer.toggle_node_inspector'),
          type: 'checkbox',
          dev: true,
          checked: Debugger.isNodeInspectorEnabled,
          click () {
            Debugger.toggleNodeInspector();
          }
        },
        {
          label: _T('MAIN_MENU.developer.toggle_repl'),
          type: 'checkbox',
          dev: true,
          checked: Debugger.isReplEnabled,
          click () {
            Debugger.toggleRepl();
          }
        },
        { type: 'separator' },
        {
          label: 'Human Tests',
          dev: true,
          submenu: [
            { type: 'separator' },
            {
              label: 'Throw an Uncaught Exception',
              click () {
                throw new Error('Editor-Framework encountered an unknown error.');
              }
            },
            {
              label: 'send2panel \'foo:bar\' foobar.panel',
              click () {
                Ipc.sendToPanel( 'foobar', 'foo:bar' );
              }
            },
          ],
        },
        { type: 'separator' },
      ]
    },
  ];
}

// ========================================
// Ipc
// ========================================

const ipcMain = Electron.ipcMain;

// ipc
ipcMain.on('main-menu:init', () => {
  MainMenu.init();
});

ipcMain.on('main-menu:add', ( event, path, template ) => {
  MainMenu.add( path, template );
});

ipcMain.on('main-menu:remove', ( event, path ) => {
  MainMenu.remove( path );
});

ipcMain.on('main-menu:set', ( event, path, options ) => {
  MainMenu.set( path, options );
});

ipcMain.on('main-menu:update', ( event, path, template ) => {
  MainMenu.update( path, template );
});

ipcMain.on('main-menu:apply', () => {
  MainMenu.apply();
});
