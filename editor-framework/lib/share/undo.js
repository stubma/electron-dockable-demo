'use strict';

const Electron = require('electron');
const EventEmitter = require('events');
const Platform = require('./platform');

let Ipc, Console;
if ( Platform.isMainProcess ) {
  Ipc = require('../main/ipc');
  Console = require('../main/console');
} else {
  Ipc = require('../renderer/ipc');
  Console = require('../renderer/console');
}

let _global;

// ==========================
// Internal
// ==========================

/**
 * @class Command
 */
class Command {
  constructor ( info ) {
    this.info = info;
  }
  undo () { Console.warn('Please implement the "undo" function in your command'); }
  redo () { Console.warn('Please implement the "redo" function in your command'); }
  dirty () { return true; }
}

/**
 * @class CommandGroup
 */
class CommandGroup {
  constructor () {
    this._commands = [];
    this.desc = '';
  }

  undo () {
    for ( let i = this._commands.length-1; i >= 0; --i ) {
      this._commands[i].undo();
    }
  }

  redo () {
    for ( let i = 0; i < this._commands.length; ++i ) {
      this._commands[i].redo();
    }
  }

  dirty () {
    for ( let i = 0; i < this._commands.length; ++i ) {
      if ( this._commands[i].dirty() ) {
        return true;
      }
    }
    return false;
  }

  add ( cmd ) {
    this._commands.push(cmd);
  }

  clear () {
    this._commands = [];
  }

  canCommit () {
    return this._commands.length;
  }
}

/**
 * @class UndoList
 */
class UndoList extends EventEmitter {
  constructor (type) {
    super();

    this._silent = false;

    this._type = type;
    this._curGroup = new CommandGroup();
    this._groups = [];
    this._position = -1;
    this._savePosition = -1;

    this._id2cmdDef = {};
  }

  register ( id, def ) {
    this._id2cmdDef[id] = def;
  }

  reset () {
    this.clear();
    this._id2cmdDef = {};
  }

  undo () {
    // check if we have un-commit group
    if ( this._curGroup.canCommit() ) {
      this._curGroup.undo();
      this._changed('undo-cache');

      this._curGroup.clear();
      return;
    }

    // check if can undo
    if ( this._position < 0 ) {
      return;
    }

    let group = this._groups[this._position];
    group.undo();
    this._position--;

    this._changed('undo');
  }

  redo () {
    // check if can redo
    if ( this._position >= this._groups.length-1 ) {
      return;
    }

    this._position++;
    let group = this._groups[this._position];
    group.redo();

    this._changed('redo');
  }

  add ( id, info ) {
    let ctor = this._id2cmdDef[id];
    if ( !ctor ) {
      Console.error( `Cannot find undo command ${id}, please register it first` );
      return;
    }

    this._clearRedo();
    let cmd = new ctor(info);
    this._curGroup.add(cmd);

    this._changed('add-command');
  }

  commit () {
    if ( this._curGroup.canCommit() ) {
      this._groups.push(this._curGroup);
      this._position++;

      this._changed('commit');
    }
    this._curGroup = new CommandGroup();
  }

  cancel () {
    this._curGroup.clear();
  }

  collapseTo ( index ) {
    // invalid index
    if ( index > this._position || index < 0 ) {
      Console.warn(`Cannot collapse undos to ${index}`);
      return;
    }

    // do nothing if index is same as position
    if ( index === this._position ) {
      return;
    }

    // TODO: we can check if command is same type as the before one,
    //       then invoke command.collapse(otherCmdInfo) when collapse commands
    let group = this._groups[index];
    for ( let i = index+1; i < this._groups.length; ++i ) {
      let g = this._groups[i];
      g._commands.forEach(cmd => {
        group.add(cmd);
      });
    }
    this._groups = this._groups.slice(0, index+1);

    this._position = index;
    if ( this._savePosition > this._position ) {
      this._savePosition = this._position;
    }
    this._changed('collapse');
  }

  save () {
    this._savePosition = this._position;
    this._changed('save');
  }

  clear () {
    this._curGroup = new CommandGroup();
    this._groups = [];
    this._position = -1;
    this._savePosition = -1;

    this._changed('clear');
  }

  dirty () {
    if ( this._savePosition !== this._position ) {
      let min = Math.min(this._position, this._savePosition);
      let max = Math.max(this._position, this._savePosition);

      for ( let i=min+1; i <= max; i++ ) {
        if ( this._groups[i].dirty() ) {
          return true;
        }
      }
    }

    return false;
  }

  setCurrentDescription ( desc ) {
    this._curGroup.desc = desc;
  }

  _clearRedo () {
    if ( this._position+1 === this._groups.length ) {
      return;
    }

    this._groups = this._groups.slice(0, this._position+1);
    this._curGroup.clear();

    if ( this._savePosition > this._position ) {
      this._savePosition = this._position;
    }
    this._changed('clear-redo');
  }

  _changed ( type ) {
    if ( this._silent ) {
      return;
    }

    if ( this._type === 'local' ) {
      this.emit('changed', type);
      return;
    }

    Ipc.sendToAll('undo:changed', type);
  }
}

if ( Platform.isMainProcess ) {
  _global = new UndoList('global');
}

// ==========================
// exports
// ==========================

/**
 * Undo
 * @module Editor.Undo
 */
let Undo = {
  /**
   * @method undo
   */
  undo () {
    if ( Platform.isRendererProcess ) {
      Ipc.sendToMain('undo:perform-undo');
      return;
    }

    _global.undo();
  },

  /**
   * @method redo
   */
  redo () {
    if ( Platform.isRendererProcess ) {
      Ipc.sendToMain('undo:perform-redo');
      return;
    }

    _global.redo();
  },

  /**
   * @method add
   * @param {string} id
   * @param {object} info
   */
  add ( id, info ) {
    if ( Platform.isRendererProcess ) {
      Ipc.sendToMain('undo:add', id, info );
      return;
    }

    _global.add(id, info);
  },

  /**
   * @method commit
   */
  commit () {
    if ( Platform.isRendererProcess ) {
      Ipc.sendToMain('undo:commit');
      return;
    }

    _global.commit();
  },

  /**
   * @method cancel
   */
  cancel () {
    if ( Platform.isRendererProcess ) {
      Ipc.sendToMain('undo:cancel');
      return;
    }

    _global.cancel();
  },

  /**
   * @method collapseTo
   * @param {number} index
   */
  collapseTo ( index ) {
    if ( Platform.isRendererProcess ) {
      Ipc.sendToMain('undo:collapse', index );
      return;
    }

    _global.collapseTo(index);
  },

  /**
   * @method save
   */
  save () {
    if ( Platform.isRendererProcess ) {
      Ipc.sendToMain('undo:save');
      return;
    }

    _global.save();
  },

  /**
   * @method clear
   */
  clear () {
    if ( Platform.isRendererProcess ) {
      Ipc.sendToMain('undo:clear');
      return;
    }

    _global.clear();
  },

  /**
   * @method reset
   */
  reset () {
    if ( Platform.isRendererProcess ) {
      Ipc.sendToMain('undo:reset');
      return;
    }

    return _global.reset();
  },

  /**
   * @method dirty
   */
  dirty () {
    if ( Platform.isRendererProcess ) {
      return Ipc.sendToMainSync('undo:dirty');
    }

    return _global.dirty();
  },

  /**
   * @method setCurrentDescription
   */
  setCurrentDescription ( desc ) {
    if ( Platform.isRendererProcess ) {
      return Ipc.sendToMainSync('undo:set-desc', desc);
    }

    return _global.setCurrentDescription( desc );
  },

  /**
   * @method register
   * @param {string} id
   * @param {Command} def
   */
  register ( id, def ) {
    _global.register(id,def);
  },

  local () {
    return new UndoList('local');
  },

  Command: Command,

  // for TEST
  _global: _global,
};

module.exports = Undo;

// ==========================
// Ipc
// ==========================

if ( Platform.isMainProcess ) {
  const ipcMain = Electron.ipcMain;

  ipcMain.on( 'undo:perform-undo', () => { Undo.undo(); });
  ipcMain.on( 'undo:perform-redo', () => { Undo.redo(); });
  ipcMain.on( 'undo:add', ( event, id, info ) => { Undo.add( id, info ); });
  ipcMain.on( 'undo:commit', () => { Undo.commit(); });
  ipcMain.on( 'undo:cancel', () => { Undo.cancel(); });
  ipcMain.on( 'undo:collapse', ( index ) => { Undo.collapseTo( index ); });
  ipcMain.on( 'undo:save', () => { Undo.save(); });
  ipcMain.on( 'undo:clear', () => { Undo.clear(); });
  ipcMain.on( 'undo:dirty', event => { event.returnValue = Undo.dirty(); });
  ipcMain.on( 'undo:set-desc', (event, desc) => { Undo.setCurrentDescription(desc); });
  ipcMain.on( 'undo:reset', () => { Undo.reset(); });
}
