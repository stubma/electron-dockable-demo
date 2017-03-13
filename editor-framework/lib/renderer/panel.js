'use strict';

/**
 * @module Panel
 */
let Panel = {};
module.exports = Panel;

// requires
const Electron = require('electron');
const Mousetrap = require('mousetrap');
const Path = require('fire-path');

const PanelLoader = require('./panel-loader');
const UI = require('./ui');
const Console = require('./console');
const Ipc = require('./ipc');
const i18n = require('./i18n');
const IpcListener = require('../share/ipc-listener');
const IpcBase = require('../share/ipc');

let _id2panelInfo = {};
// let _url2link = {};
let _outOfDatePanels = [];

let ErrorNoPanel = IpcBase.ErrorNoPanel;
let ErrorNoMsg = IpcBase.ErrorNoMsg;

// ==========================
// exports
// ==========================

/**
 * @method load
 * @param {string} panelID - The panelID
 * @param {function} cb
 *
 * Load and create panel frame via `panelID`
 */
Panel.load = function ( panelID, cb ) {
  Ipc.sendToMain('editor:panel-query-info', panelID, ( err, info ) => {
    if ( !info ) {
      if ( cb ) {
        cb ( new Error(`Failed to load panel ${panelID}: panel-info not found`) );
      }

      return;
    }

    PanelLoader.load(panelID, info, (err, frameEL) => {
      if ( err ) {
        if ( cb ) {
          cb (err);
        }

        return;
      }

      Ipc.sendToMain('editor:panel-dock', panelID);

      if ( info.icon ) {
        frameEL.icon = new Image();
        frameEL.icon.src = Path.join( info.path, info.icon );
      }
      frameEL.setAttribute('id', panelID);
      frameEL.setAttribute('name', i18n.format(info.title));
      frameEL.messages = frameEL.messages || {};

      // set size attribute
      if ( info.width ) {
        frameEL.setAttribute( 'width', info.width );
      }

      if ( info.height ) {
        frameEL.setAttribute( 'height', info.height );
      }

      if ( info['min-width'] ) {
        frameEL.setAttribute( 'min-width', info['min-width'] );
      }

      if ( info['min-height'] ) {
        frameEL.setAttribute( 'min-height', info['min-height'] );
      }

      if ( info['max-width'] ) {
        frameEL.setAttribute( 'max-width', info['max-width'] );
      }

      if ( info['max-height'] ) {
        frameEL.setAttribute( 'max-height', info['max-height'] );
      }

      // register ipc events
      let ipcListener = new IpcListener();
      for ( name in frameEL.messages ) {
        _registerIpc( ipcListener, panelID, frameEL, name, frameEL.messages[name] );
      }

      // register profiles
      frameEL.profiles = info.profiles;
      for ( let type in info.profiles ) {
        _registerProfile ( panelID, type, info.profiles[type] );
      }

      // register shortcuts
      // TODO: load overwrited shortcuts from profile?
      let mousetrapList = [];
      if ( info.shortcuts ) {
        let mousetrap = new Mousetrap(frameEL);
        mousetrapList.push(mousetrap);

        for ( let name in info.shortcuts ) {
          if ( name.length > 1 && name[0] === '#' ) {
            let subElement;

            if ( !info.ui ) {
              subElement = frameEL.root.querySelector(name);
            } else {
              subElement = frameEL.querySelector(name);
            }

            if ( !subElement ) {
              Console.warn(`Failed to register shortcut for element ${name}, cannot find it.`);
              continue;
            }

            let subShortcuts = info.shortcuts[name];
            let subMousetrap = new Mousetrap(subElement);
            mousetrapList.push(subMousetrap);

            for ( let subShortcut in subShortcuts ) {
              _registerShortcut(
                panelID,
                subMousetrap,
                frameEL, // NOTE: here must be frameEL
                subShortcut,
                subShortcuts[subShortcut]
              );
            }
          } else {
            _registerShortcut(
              panelID,
              mousetrap,
              frameEL,
              name,
              info.shortcuts[name]
            );
          }
        }
      }

      //
      _id2panelInfo[panelID] = {
        frameEL: frameEL,
        popable: info.popable,
        ipcListener: ipcListener,
        mousetrapList: mousetrapList,
      };

      // run panel-ready if exists
      if ( !info.ui ) {
        let ready = frameEL.ready;
        if ( ready && typeof ready === 'function' ) {
          ready.apply(frameEL);
        }
      } else if ( info.ui === 'polymer' ) {
        let panelReady = frameEL['panel-ready'];
        if ( panelReady && typeof panelReady === 'function' ) {
          panelReady.apply(frameEL);
        }
      }

      // done
      if ( cb ) {
        cb ( null, frameEL, info );
      }
    });
  });
};

/**
 * @method unload
 * @param {string} panelID - The panelID
 *
 * Unload a panel via `panelID`
 */
Panel.unload = function ( panelID ) {
  // remove panelInfo
  let panelInfo = _id2panelInfo[panelID];
  if ( !panelInfo) {
    return;
  }

  panelInfo.ipcListener.clear();
  for ( let i = 0; i < panelInfo.mousetrapList.length; ++i ) {
    panelInfo.mousetrapList[i].reset();
  }
  delete _id2panelInfo[panelID];
};

/**
 * @method open
 * @param {string} panelID - The panelID
 * @param {object} argv
 *
 * Open a panel via `panelID`
 */
Panel.open = function ( panelID, argv ) {
  Ipc.sendToMain('editor:panel-open', panelID, argv);
};

/**
 * @method popup
 * @param {string} panelID - The panelID
 *
 * Popup an exists panel via `panelID`
 */
Panel.popup = function ( panelID ) {
  let panelCounts = Object.keys(_id2panelInfo).length;

  if ( panelCounts > 1 ) {
    Panel.close(panelID);
    Ipc.sendToMain('editor:panel-open', panelID);
  }
};

/**
 * @method close
 * @param {string} panelID - The panelID
 *
 * Close a panel via `panelID`
 */
Panel.close = function ( panelID ) {
  if ( Panel.undock(panelID) ) {
    Ipc.sendToMain('editor:panel-close', panelID);
  }
};

/**
 * @method close
 * @param {function} cb
 *
 * Close all exists panels in current window
 */
Panel.closeAll = function ( cb ) {
  // check if we can close all panel frame, if one of the panel frame refuse close, stop the callback
  for ( let id in _id2panelInfo ) {
    let frameEL = Panel.find(id);
    if ( frameEL && frameEL.close && frameEL.close() === false ) {
      if ( cb ) {
        cb ( new Error(`Failed to close panel ${id}`) );
      }
      return;
    }
  }

  // if we have root, clear all children in it
  let rootEL = UI.DockUtils.root;
  if ( rootEL ) {
    rootEL.remove();
    UI.DockUtils.root = null;
  }

  let panelIDs = [];
  for ( let id in _id2panelInfo ) {
    // unload panelInfo
    Panel.unload(id);
    panelIDs.push(id);
  }

  if ( panelIDs.length === 0 ) {
    if ( cb ) {
      cb();
    }
    return;
  }

  let finishCount = panelIDs.length;
  for ( let i = 0; i < panelIDs.length; ++i ) {
    Ipc.sendToMain('editor:panel-wait-for-close', panelIDs[i], () => {
      --finishCount;
      if ( finishCount === 0 && cb ) {
        cb();
      }
    });
  }
};

/**
 * @method undock
 * @param {string} panelID
 *
 * Remove a panel element from document but do not close it.
 */
Panel.undock = function ( panelID ) {
  // remove panel element from tab
  let frameEL = Panel.find(panelID);
  if ( !frameEL ) {
    // unload panelInfo
    Panel.unload(panelID);

    return true;
  }

  // user prevent close it
  if ( frameEL.close && frameEL.close() === false ) {
    return false;
  }

  //
  let panelEL = frameEL.parentNode;
  if ( panelEL.tagName === UI.Panel.tagName ) {
    let currentTabEL = panelEL.$.tabs.findTab(frameEL);
    panelEL.close(currentTabEL);
  } else {
    panelEL.removeChild(frameEL);
  }

  //
  UI.DockUtils.flush();
  UI.DockUtils.saveLayout();

  // unload panelInfo
  Panel.unload(panelID);

  return true;
};

Panel._dispatch = function (panelID, message, event, ...args) {
  let panelInfo = _id2panelInfo[panelID];
  if ( !panelInfo ) {
    Console.warn(`Failed to send ipc message ${message} to panel ${panelID}, panel not found`);

    if ( event.reply ) {
      event.reply( new ErrorNoPanel(panelID, message) );
    }

    return;
  }

  let frameEL = panelInfo.frameEL;
  let fn = frameEL.messages[message];

  if ( !fn || typeof fn !== 'function' ) {
    Console.warn(`Failed to send ipc message ${message} to panel ${panelID}, message not found`);

    if ( event.reply ) {
      event.reply( new ErrorNoMsg(panelID, message) );
    }

    return;
  }

  fn.apply( frameEL, [event, ...args] );
};

/**
 * @method dumpLayout
 *
 * Dump the layout of the panels in current window
 */
Panel.dumpLayout = function () {
  let root = UI.DockUtils.root;
  if ( !root ) {
    return null;
  }

  if ( root._dockable ) {
    return {
      'type': 'dock',
      'row': root.row,
      'no-collapse': true,
      'docks': _getDocks(root),
    };
  } else {
    let id = root.getAttribute('id');
    let rect = root.getBoundingClientRect();

    return {
      'type': 'standalone',
      'panel': id,
      'width': rect.width,
      'height': rect.height,
    };
  }
};

/**
 * @method find
 * @param {string} panelID - The panelID
 *
 * Find panel frame via `panelID`.
 */
Panel.find = function ( panelID ) {
  let panelInfo = _id2panelInfo[panelID];
  if ( !panelInfo ) {
    return null;
  }
  return panelInfo.frameEL;
};

/**
 * @method focus
 * @param {string} panelID - The panelID
 *
 * Focus panel via `panelID`.
 */
Panel.focus = function ( panelID ) {
  let frameEL = Panel.find(panelID);
  if ( frameEL ) {
    let panelEL = frameEL.parentNode;
    if ( panelEL.tagName === UI.Panel.tagName ) {
      panelEL.select(frameEL);
    }
  }
};

/**
 * @method getFocusedPanel
 *
 * Get current focused panel
 */
Panel.getFocusedPanel = function () {
  for ( let id in _id2panelInfo ) {
    let panelInfo = _id2panelInfo[id];

    let frameEL = panelInfo.frameEL;
    let panelEL = frameEL.parentNode;

    if ( panelEL.focused ) {
      return panelEL.activeTab.frameEL;
    }
  }

  return null;
};

/**
 * @method getPanelInfo
 * @param {string} panelID - The panelID
 *
 * Get panel info via `panelID`
 */
Panel.getPanelInfo = function ( panelID ) {
  return _id2panelInfo[panelID];
};

// TODO
// position: top, bottom, left, right, top-left, top-right, bottom-left, bottom-right
// Panel.dockAt = function ( position, panelEL ) {
//     var root = UI.DockUtils.root;
//     if ( !root ) {
//         return null;
//     }
//     if ( !root._dockable ) {
//         return null;
//     }
// }

/**
 * @method isDirty
 * @param {string} panelID - The panelID
 *
 * Check if the specific panel is dirty
 */
Panel.isDirty = function ( panelID ) {
  return _outOfDatePanels.indexOf(panelID) !== -1;
};

/**
 * @method extend
 * @param {object} prototype
 *
 * Extends a panel
 */
Panel.extend = function (proto) {
  return proto;
};

/**
 * @property panels
 *
 * Get panels docked in current window
 */
Object.defineProperty(Panel, 'panels', {
  enumerable: true,
  get () {
    let results = [];

    for ( let id in _id2panelInfo ) {
      let panelInfo = _id2panelInfo[id];
      results.push(panelInfo.frameEL);
    }

    return results;
  },
});

// ==========================
// Internal
// ==========================

function _getPanels ( panelEL ) {
  let panels = [];

  for ( let i = 0; i < panelEL.children.length; ++i ) {
    let childEL = panelEL.children[i];
    let id = childEL.getAttribute('id');
    panels.push(id);
  }

  return panels;
}

function _getDocks ( dockEL ) {
  let docks = [];

  for ( let i = 0; i < dockEL.children.length; ++i ) {
    let childEL = dockEL.children[i];

    if ( !childEL._dockable ) {
      continue;
    }

    let rect = childEL.getBoundingClientRect();
    let info = {
      'row': childEL.row,
      'width': rect.width,
      'height': rect.height,
    };

    if ( childEL.tagName === UI.Panel.tagName ) {
      info.type = 'panel';
      info.active = childEL.activeIndex;
      info.panels = _getPanels(childEL);
    } else {
      info.type = 'dock';
      info.docks = _getDocks(childEL);
    }

    docks.push(info);
  }

  return docks;
}

function _registerIpc ( ipcListener, panelID, frameEL, message, fn ) {
  if ( !fn || typeof fn !== 'function' ) {
    Console.warn(
      `Failed to register ipc message ${message} in panel ${panelID}, function not provide.`
    );
    return;
  }

  ipcListener.on(message, (event, ...args) => {
    fn.apply( frameEL, [event, ...args] );
  });
}

function _registerProfile ( panelID, type, profile ) {
  profile.save = function () {
    Ipc.sendToMain('editor:save-profile', panelID, type, profile);
  };
}

function _registerShortcut ( panelID, mousetrap, frameEL, shortcut, methodName ) {
  var fn = frameEL[methodName];
  if ( typeof fn === 'function' ) {
    mousetrap.bind(shortcut, fn.bind(frameEL) );
  } else {
    Console.warn(
      `Failed to register shortcut, cannot find method ${methodName} in panel ${panelID}.`
    );
  }
}

// ==========================
// Ipc events
// ==========================

const ipcRenderer = Electron.ipcRenderer;

ipcRenderer.on('editor:panel-close', ( event, panelID ) => {
  // NOTE: if we don't do this in requestAnimationFrame,
  // the tab will remain, something wrong for Polymer.dom
  // operation when they are in ipc callback.
  window.requestAnimationFrame(() => {
    Panel.close(panelID);
  });
});

ipcRenderer.on('editor:panel-popup', ( event, panelID ) => {
  window.requestAnimationFrame(() => {
    Panel.close(panelID);
    Ipc.sendToMain('editor:panel-open', panelID);
  });
});

ipcRenderer.on('editor:panel-undock', ( event, panelID ) => {
  window.requestAnimationFrame(() => {
    Panel.undock(panelID);
  });
});

ipcRenderer.on('editor:panel-run', ( event, panelID, argv ) => {
  Panel.focus(panelID);

  let frameEL = Panel.find(panelID);
  if ( frameEL && frameEL.run ) {
    frameEL.run(argv);
  }
});

ipcRenderer.on('editor:panel-out-of-date', ( event, panelID ) => {
  let frameEL = Panel.find(panelID);
  if ( frameEL ) {
    let panelEL = frameEL.parentNode;
    if ( panelEL.tagName === UI.Panel.tagName ) {
      panelEL.outOfDate(frameEL);
    }
  }

  if ( _outOfDatePanels.indexOf(panelID) === -1 ) {
    _outOfDatePanels.push(panelID);
  }
});
