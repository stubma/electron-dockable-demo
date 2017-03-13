'use strict';

/**
 * @module Editor.Panel
 *
 * Panel module for operating specific panel
 */
let Panel = {};
module.exports = Panel;

const Electron = require('electron');
const Profile = require('./profile');
const Window = require('./window');
const Console = require('./console');
const Package = require('./package');

let _panel2windows = {};
let _panel2argv = {};

// ========================================
// exports
// ========================================

/**
 * @property templateUrl
 *
 * The html entry file used for standalone panel window. Default is 'editor-framework://static/window.html'.
 */
Panel.templateUrl = 'editor-framework://static/window.html';

/**
 * @method open
 * @param {string} panelID - The panelID.
 * @param {object} argv - Argument store as key-value table, which will be used in panel's `run` function in renderer process.
 *
 * Open a panel via `panelID` and pass `argv` to it. The `argv` will be execute in panel's run function in renderer process.
 */
Panel.open = function ( panelID, argv ) {
  let panelInfo = Package.panelInfo(panelID);
  if ( !panelInfo ) {
    Console.error(`Failed to open panel ${panelID}, panel info not found.`);
    return;
  }

  _panel2argv[panelID] = argv;

  // if we found the window, send editor:panel-run to trigger the panel.run in renderer
  // otherwise we will wait until editor:panel-ready message back from renderer
  let editorWin = Panel.findWindow(panelID);
  if ( editorWin ) {
    editorWin.show();
    editorWin.focus();
    editorWin.send( 'editor:panel-run', panelID, argv );
    return;
  }

  //
  let windowName = `window-${new Date().getTime()}`;
  let winopts = {
    useContentSize: true,
    width: parseInt(panelInfo.width),
    height: parseInt(panelInfo.height),
    minWidth: parseInt(panelInfo['min-width']),
    minHeight: parseInt(panelInfo['min-height']),
    maxWidth: parseInt(panelInfo['max-width']),
    maxHeight: parseInt(panelInfo['max-height']),
    frame: panelInfo.frame,
    resizable: panelInfo.resizable,
  };

  // NOTE: only simple window can disable devtools
  if ( panelInfo.disableDevTools && panelInfo.type === 'simple' ) {
    winopts.disableDevTools = true;
  }

  // load layout-settings, and find windows by name
  let layoutProfile = Profile.load(`layout.${panelID}`, 'local' );
  if ( layoutProfile ) {
    if ( layoutProfile.x ) {
      winopts.x = parseInt(layoutProfile.x);
    }

    if ( layoutProfile.y ) {
      winopts.y = parseInt(layoutProfile.y);
    }

    if ( layoutProfile.width ) {
      winopts.width = parseInt(layoutProfile.width);
    }

    if ( layoutProfile.height ) {
      winopts.height = parseInt(layoutProfile.height);
    }
  }

  winopts.windowType = panelInfo.type || 'dockable';

  // NOTE: non-resizable window always use package.json settings
  if ( !winopts.resizable ) {
    winopts.width = parseInt(panelInfo.width);
    winopts.height = parseInt(panelInfo.height);
  }

  if ( isNaN(winopts.width) ) {
    winopts.width = 400;
  }

  if ( isNaN(winopts.height) ) {
    winopts.height = 400;
  }

  if ( isNaN(winopts.minWidth) ) {
    winopts.minWidth = 200;
  }

  if ( isNaN(winopts.minHeight) ) {
    winopts.minHeight = 200;
  }

  //
  editorWin = new Window(windowName, winopts);
  _dock( panelID, editorWin );

  // NOTE: In Windows platform, hide the menu bar will make the content size increased to fill the menu bar space.
  // re-calling setContentSize will solve the problem
  editorWin.nativeWin.setMenuBarVisibility(false);
  editorWin.nativeWin.setContentSize( winopts.width, winopts.height );

  if ( panelInfo.type === 'simple' ) {
    let names = panelID.split('.');
    editorWin.load(`packages://${names[0]}/${panelInfo.main}`, argv);
  } else {
    editorWin.load(Panel.templateUrl, {
      panelID: panelID
    });
  }
  editorWin.focus();
};

/**
 * @method close
 * @param {string} panelID - The panelID
 *
 * Close a panel via `panelID`
 */
Panel.close = function ( panelID ) {
  let editorWin = _undock(panelID);
  if ( !editorWin ) {
    return;
  }

  _saveLayout( editorWin, panelID );

  // check if we have other panels in the same window
  // if no panels left, we close the window
  let found = false;
  for ( let id in _panel2windows ) {
    if ( editorWin === _panel2windows[id] ) {
      found = true;
      break;
    }
  }

  // if not panel exists in this window, and it is not the main window, close it.
  if ( !found && !editorWin.isMainWindow ) {
    editorWin.close();
  }
};

/**
 * @method findWindow
 * @param {string} panelID - The panelID
 * @return {Editor.Window}
 *
 * Find and return an editor window that contains the panelID
 */
Panel.findWindow = function ( panelID ) {
  return _panel2windows[panelID];
};

/**
 * @method findWindows
 * @param {string} packageName
 * @return {Editor.Window[]}
 *
 * Find and return editor window list that contains panel defined in package via packageName
 */
Panel.findWindows = function (packageName) {
  let wins = [];

  for ( let p in _panel2windows ) {
    let pair = p.split('.');
    if ( pair.length !== 2 ) {
      continue;
    }

    let name = pair[1];
    if ( name === packageName ) {
      let editorWin = _panel2windows[p];

      if ( wins.indexOf (editorWin) === -1 ) {
        wins.push(editorWin);
      }
    }
  }

  return wins;
};

/**
 * @method findPanels
 * @param {string} packageName
 * @return {string[]}
 *
 * Find and return panel ID list that contains panel defined in package via packageName
 */
Panel.findPanels = function ( packageName ) {
  let panelIDs = [];
  for ( let p in _panel2windows ) {
    let pair = p.split('.');
    if ( pair.length !== 2 ) {
      continue;
    }

    let name = pair[0];
    if ( name === packageName ) {
      panelIDs.push(pair);
    }
  }

  return panelIDs;
};

/**
 * @method closeAll
 * @param {string} packageName
 *
 * Close all panels defined in package via packageName
 */
Panel.closeAll = function (packageName) {
  let panelIDs = Panel.findPanels(packageName);
  for (let i = 0; i < panelIDs.length; ++i) {
    Panel.close( panelIDs[i] );
  }
};

// NOTE: this only invoked in window on-close event
// NOTE: please go to read main/window.js 'on-close' event comment for more detail about why we do _saveLayout here
Panel._onWindowClose = function ( editorWin ) {
  for ( let id in _panel2windows ) {
    let win = _panel2windows[id];
    if ( win === editorWin ) {
      _saveLayout( editorWin, id );
    }
  }
};

// NOTE: this only invoked in window on-closed event
Panel._onWindowClosed = function ( editorWin ) {
  for ( let id in _panel2windows ) {
    let win = _panel2windows[id];
    if ( win === editorWin ) {
      delete _panel2windows[id];
    }
  }
};

// ========================================
// Internal
// ========================================

function _dock ( panelID, win ) {
  // Console.info('%s dock to %s', panelID, win.name ); // DEBUG

  let editorWin = _panel2windows[panelID];

  // if we found same panel dock in different place
  if ( editorWin && editorWin !== win ) {
    // TODO: should we report error ????
  }

  _panel2windows[panelID] = win;
}

function _undock ( panelID ) {
  let editorWin = _panel2windows[panelID];
  // Console.info('%s undock from %s', panelID, editorWin.name ); // DEBUG

  if ( editorWin ) {
    editorWin.send( 'editor:panel-undock', panelID );
    delete _panel2windows[panelID];
    return editorWin;
  }

  return null;
}

function _saveLayout ( editorWin, panelID ) {
  // save standalone panel's layout
  if ( !editorWin.isMainWindow ) {
    let panelProfile = Profile.load( `layout.${panelID}`, 'local' );
    let winSize = editorWin.nativeWin.getContentSize();
    let winPos = editorWin.nativeWin.getPosition();

    panelProfile.x = winPos[0];
    panelProfile.y = winPos[1];
    panelProfile.width = winSize[0];
    panelProfile.height = winSize[1];
    panelProfile.save();
  }
}

// ========================================
// Ipc
// ========================================

const ipcMain = Electron.ipcMain;

ipcMain.on('editor:panel-query-info', ( event, panelID ) => {
  if ( !panelID ) {
    Console.error( 'A `editor:panel-query-info` message failed because the panelID was empty.' );
    event.reply();
    return;
  }

  // get panelInfo
  let panelInfo = Package.panelInfo(panelID);
  if ( panelInfo ) {
    // load profiles
    for ( let type in panelInfo.profiles ) {
      let profile = panelInfo.profiles[type];
      profile = Profile.load( panelID, type, profile );
      panelInfo.profiles[type] = profile;
    }
  }

  //
  event.reply( null, panelInfo );
});

ipcMain.on('editor:panel-argv', ( event, panelID ) => {
  let argv = _panel2argv[panelID];
  event.reply( null, argv );
});

ipcMain.on('editor:panel-open', ( event, panelID, argv ) => {
  Panel.open( panelID, argv );
});

ipcMain.on('editor:panel-dock', ( event, panelID ) => {
  let browserWin = Electron.BrowserWindow.fromWebContents( event.sender );
  let editorWin = Window.find(browserWin);
  _dock( panelID, editorWin );
});

ipcMain.on('editor:panel-close', ( event, panelID ) => {
  Panel.close( panelID );
});

ipcMain.on('editor:panel-wait-for-close', ( event, panelID ) => {
  Panel.close( panelID );
  event.reply();
});
