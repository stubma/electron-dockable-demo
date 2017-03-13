'use strict';

const Electron = require('electron');
const _ = require('lodash');
const Platform = require('./platform');

let Ipc, Console;
if ( Platform.isMainProcess ) {
  Ipc = require('../main/ipc');
  Console = require('../main/console');
} else {
  Ipc = require('../renderer/ipc');
  Console = require('../renderer/console');
}

let _lastActiveHelper = null;
let _helpers = {};

const IPC_SELECTED = 'selection:selected';       // argument is an array of ids
const IPC_UNSELECTED = 'selection:unselected';   // argument is an array of ids
const IPC_ACTIVATED = 'selection:activated';     // argument is an id
const IPC_DEACTIVATED = 'selection:deactivated'; // argument is an id
const IPC_HOVERIN = 'selection:hoverin';         // argument is an id
const IPC_HOVEROUT = 'selection:hoverout';       // argument is an id
const IPC_CONTEXT = 'selection:context';
const IPC_CHANGED = 'selection:changed';
const IPC_PATCH = 'selection:patch';

// ==========================
// exports
// ==========================

/**
 * @module Editor.Selection
 */

let Selection = {
  /**
   * @method register
   * @param {string} type
   */
  register ( type ) {
    if ( !Platform.isMainProcess ) {
      Console.warn('Editor.Selection.register can only be called in core level.');
      return;
    }

    if ( _helpers[type] ) {
      return;
    }

    _helpers[type] = new ConfirmableSelectionHelper(type);
  },

  /**
   * @method reset
   */
  reset () {
    for ( let p in _helpers ) {
      _helpers[p].clear();
    }
    _helpers = {};
  },

  /**
   * @method local
   */
  local () {
    return new ConfirmableSelectionHelper('local');
  },

  /**
   * @method confirm
   *
   * Confirms all current selecting objects, no matter which type they are.
   * This operation may trigger deactivated and activated events.
   */
  confirm () {
    for ( let p in _helpers ) {
      _helpers[p].confirm();
    }
  },

  /**
   * @method cancel
   *
   * Cancels all current selecting objects, no matter which type they are.
   * This operation may trigger selected and unselected events.
   */
  cancel () {
    for ( let p in _helpers ) {
      _helpers[p].cancel();
    }
  },

  /**
   * @method confirmed
   * @param {string} type
   *
   * Check if selection is confirmed
   */
  confirmed ( type ) {
    let helper = _helpers[type];
    if ( !helper ) {
      Console.error('Cannot find the type %s for selection. Please register it first.', type);
      return false;
    }

    return helper.confirmed;
  },

  // NOTE
  // if confirm === false, it means you are in rect selecting state, but have not confirmed yet.
  // in this state, the `selected` messages will be broadcasted, but the `activated` messages will not.
  // after that, if you confirm the selection, `activated` message will be sent, otherwise `unselected` message will be sent.
  // if confirm === true, the activated will be sent in the same time.
  /**
   * @method select
   * @param {string} type
   * @param {(string|string[])} id
   * @param {Boolean} [unselectOthers=true]
   * @param {Boolean} [confirm=true]
   *
   * Select item with its id.
   */
  select ( type, id, unselectOthers, confirm ) {
    let helper = _helpers[type];
    if ( !helper ) {
      Console.error('Cannot find the type %s for selection. Please register it first.', type);
      return;
    }

    if ( id && typeof id !== 'string' && !Array.isArray(id) ) {
      Console.error('The 2nd argument for `Editor.Selection.select` must be a string or array');
      return;
    }

    helper.select(id, unselectOthers, confirm);
  },

  /**
   * @method unselect
   * @param {string} type
   * @param {(string|string[])} id
   * @param {Boolean} [confirm=true]
   *
   * Unselect item with its id.
   */
  unselect (type, id, confirm) {
    let helper = _helpers[type];
    if ( !helper ) {
      Console.error('Cannot find the type %s for selection. Please register it first.', type);
      return;
    }

    if ( id && typeof id !== 'string' && !Array.isArray(id) ) {
      Console.error('The 2nd argument for `Editor.Selection.select` must be a string or array');
      return;
    }

    helper.unselect(id, confirm);
  },

  /**
   * @method hover
   * @param {string} type
   * @param {string} id
   */
  hover ( type, id ) {
    let helper = _helpers[type];
    if ( !helper ) {
      Console.error('Cannot find the type %s for selection. Please register it first.', type);
      return;
    }

    helper.hover(id);
  },

  /**
   * @method setContext
   * @param {string} type
   * @param {string} id
   */
  setContext ( type, id ) {
    let helper = _helpers[type];
    if ( !helper ) {
      Console.error('Cannot find the type %s for selection. Please register it first.', type);
      return;
    }

    if ( id && typeof id !== 'string' ) {
      Console.error('The 2nd argument for `Editor.Selection.setContext` must be a string');
      return;
    }

    helper.setContext(id);
  },

  /**
   * @method patch
   * @param {string} type
   * @srcID {string}
   * @destID {string}
   */
  patch ( type, srcID, destID ) {
    let helper = _helpers[type];
    if ( !helper ) {
      Console.error('Cannot find the type %s for selection. Please register it first', type);
      return;
    }

    helper.patch(srcID, destID);
  },

  /**
   * @method clear
   * @param {string} type
   */
  clear ( type ) {
    let helper = _helpers[type];
    if ( !helper ) {
      Console.error('Cannot find the type %s for selection. Please register it first', type);
      return;
    }

    helper.clear();
  },

  /**
   * @method hovering
   * @param {string} type
   * @return {string} hovering
   */
  hovering ( type ) {
    let helper = _helpers[type];
    if ( !helper ) {
      Console.error('Cannot find the type %s for selection. Please register it first', type);
      return null;
    }

    return helper.lastHover;
  },

  /**
   * @method contexts
   * @param {string} type
   * @return {string} contexts
   */
  contexts ( type ) {
    let helper = _helpers[type];
    if ( !helper ) {
      Console.error('Cannot find the type %s for selection. Please register it first.', type);
      return null;
    }

    return helper.contexts;
  },

  /**
   * @method curActivate
   * @param {string} type
   * @return {string} current activated
   */
  curActivate ( type ) {
    let helper = _helpers[type];
    if ( !helper ) {
      Console.error('Cannot find the type %s for selection. Please register it first.', type);
      return null;
    }

    return helper.lastActive;
  },

  /**
   * @method curGlobalActivate
   * @return {object} - { type, id }
   */
  curGlobalActivate () {
    if ( !_lastActiveHelper ) {
      return null;
    }

    return {
      type: _lastActiveHelper.type,
      id: _lastActiveHelper.lastActive,
    };
  },

  /**
   * @method curSelection
   * @param {string} type
   * @return {string[]} selected list
   */
  curSelection ( type ) {
    let helper = _helpers[type];
    if ( !helper ) {
      Console.error('Cannot find the type %s for selection. Please register it first.', type);
      return null;
    }

    return helper.selection.slice();
  },

  /**
   * @method filter
   * @param {string[]} items - an array of ids
   * @param {string} mode - ['top-level', 'deep', 'name']
   * @param {function} func
   */
  filter ( items, mode, func ) {
    let results, item, i, j;

    if ( mode === 'name' ) {
      results = items.filter(func);
    }
    else {
      results = [];
      for ( i = 0; i < items.length; ++i ) {
        item = items[i];
        let add = true;

        for ( j = 0; j < results.length; ++j ) {
          let addedItem = results[j];

          // existed
          if ( item === addedItem ) {
            add = false;
            break;
          }

          let cmp = func( addedItem, item );
          if ( cmp > 0 ) {
            add = false;
            break;
          } else if ( cmp < 0 ) {
            results.splice(j, 1);
            --j;
          }
        }

        if ( add ) {
          results.push(item);
        }
      }
    }

    return results;
  },
};

module.exports = Selection;

// ==========================
// Internal
// ==========================

function _sendToAll (message, type, ...args) {
  if ( type === 'local' ) {
    return;
  }

  // send _selection:xxx for sync selection data exclude self
  Ipc.sendToAll.apply( null, [`_${message}`, type, ...args, Ipc.option({ excludeSelf: true })] );

  // send selection:xxx for user
  Ipc.sendToAll.apply( null, [message, type, ...args] );
}

/**
 * SelectionHelper
 * @module Editor.Selection
 */

class SelectionHelper {
  constructor ( type ) {
    this.type = type;
    this.selection = [];
    this.lastActive = null;
    this.lastHover = null;
    this._context = null; // NOTE: it is better to use lastHover, but some platform have bug with lastHover
  }

  //
  _activate (id) {
    if (this.lastActive !== id) {
      if ( this.lastActive !== null && this.lastActive !== undefined ) {
        _sendToAll( IPC_DEACTIVATED, this.type, this.lastActive );
      }
      this.lastActive = id;
      _sendToAll( IPC_ACTIVATED, this.type, id );
      _lastActiveHelper = this;

      return;
    }

    // check if last-acctive-helper is the same
    if ( _lastActiveHelper !== this ) {
      _lastActiveHelper = this;
      _sendToAll(IPC_ACTIVATED, this.type, this.lastActive);
    }
  }

  //
  _unselectOthers (id) {
    id = id || [];
    if (!Array.isArray(id)) {
      id = [id];
    }

    let unselects = _.difference(this.selection, id);
    if ( unselects.length ) {
      _sendToAll(IPC_UNSELECTED, this.type, unselects);

      this.selection = _.intersection(this.selection, id);

      // DISABLE NOTE:
      // use the order of the new select.
      // this needs us can synchornize order of the selection in all process.
      // this.selection = _.intersection(id, this.selection);

      return true;
    }

    return false;
  }

  //
  select (id, unselectOthers, notifyChanged) {
    let changed = false;
    id = id || [];
    if (!Array.isArray(id)) {
      id = [id];
    }
    unselectOthers = unselectOthers !== undefined ? unselectOthers : true;

    // unselect others
    if (unselectOthers) {
      changed = this._unselectOthers(id);
    }

    // send selected message
    if ( id.length ) {
      let diff = _.difference(id, this.selection);

      if ( diff.length  ) {
        this.selection = this.selection.concat(diff);
        _sendToAll(IPC_SELECTED, this.type, diff);
        changed = true;
      }
    }

    // activate others
    if ( id.length ) {
      this._activate(id[id.length - 1]);
    } else {
      this._activate(null);
    }

    // send changed message
    if ( changed && notifyChanged ) {
      _sendToAll(IPC_CHANGED, this.type);
    }
  }

  //
  unselect (id, notifyChanged) {
    let changed = false;
    let unselectActiveObj = false;

    id = id || [];
    if (!Array.isArray(id)) {
      id = [id];
    }

    // send unselected message
    if ( id.length ) {
      let unselects = _.intersection( this.selection, id );
      this.selection = _.difference( this.selection, id );

      if ( unselects.length ) {
        if ( unselects.indexOf(this.lastActive) !== -1 ) {
          unselectActiveObj = true;
        }

        _sendToAll(IPC_UNSELECTED, this.type, unselects);
        changed = true;
      }
    }

    // activate another
    if (unselectActiveObj) {
      if ( this.selection.length ) {
        this._activate(this.selection[this.selection.length - 1]);
      } else {
        this._activate(null);
      }
    }

    // send changed message
    if ( changed && notifyChanged ) {
      _sendToAll(IPC_CHANGED, this.type);
    }
  }

  //
  hover (id) {
    if ( this.lastHover !== id ) {
      if ( this.lastHover !== null && this.lastHover !== undefined ) {
        _sendToAll(IPC_HOVEROUT, this.type, this.lastHover);
      }

      this.lastHover = id;

      if ( id !== null && id !== undefined ) {
        _sendToAll(IPC_HOVERIN, this.type, id);
      }
    }
  }

  //
  setContext (id) {
    this._context = id;
    _sendToAll(IPC_CONTEXT, this.type, id);
  }

  //
  patch (srcID, destID) {
    let idx = this.selection.indexOf(srcID);
    if ( idx !== -1 ) {
      this.selection[idx] = destID;
    }
    if ( this.lastActive === srcID ) {
      this.lastActive = destID;
    }
    if ( this.lastHover === srcID ) {
      this.lastHover = destID;
    }
    if ( this._context === srcID ) {
      this._context = destID;
    }
    _sendToAll(IPC_PATCH, this.type, srcID, destID);
  }

  //
  clear () {
    let changed = false;

    if ( this.selection.length ) {
      _sendToAll(IPC_UNSELECTED, this.type, this.selection);
      this.selection = [];
      changed = true;
    }

    if ( this.lastActive ) {
      this._activate(null);
      changed = true;
    }

    if ( changed ) {
      _sendToAll(IPC_CHANGED, this.type);
    }
  }
}

Object.defineProperty(SelectionHelper.prototype, 'contexts', {
  enumerable: true,
  get () {
    let id = this._context;
    if ( !id ) {
      return [];
    }

    let idx = this.selection.indexOf(id);
    if (idx === -1) {
      return [id];
    }

    // make the first one as current active
    let selection = this.selection.slice(0);
    let tmp = selection[idx];
    selection.splice(idx,1);
    selection.unshift(tmp);

    return selection;
  },
});

/**
 * ConfirmableSelectionHelper
 * @module Editor.Selection
 */

class ConfirmableSelectionHelper extends SelectionHelper {
  constructor (type) {
    super(type);

    this.confirmed = true;
    this._confirmedSnapShot = []; // for cancel
  }

  //
  _checkConfirm (confirm) {
    if ( !this.confirmed && confirm ) {
      // confirm selecting
      this.confirm();
    } else if ( this.confirmed && !confirm ) {
      // take snapshot
      this._confirmedSnapShot = this.selection.slice();
      this.confirmed = false;
    }
  }

  //
  _activate (id) {
    if ( this.confirmed ) {
      super._activate( id );
    }
  }

  //
  select (id, unselectOthers, confirm) {
    confirm = confirm !== undefined ? confirm : true;

    this._checkConfirm(confirm);
    super.select(id, unselectOthers, confirm);
  }

  //
  unselect (id, confirm) {
    confirm = confirm !== undefined ? confirm : true;

    this._checkConfirm(confirm);
    super.unselect(id,confirm);
  }

  //
  confirm () {
    if ( !this.confirmed ) {
      this.confirmed = true;
      let diffs = _.xor(this._confirmedSnapShot, this.selection);
      if ( diffs.length ) {
        _sendToAll(IPC_CHANGED, this.type);
      }

      this._confirmedSnapShot = [];

      if ( this.selection.length > 0 ) {
        this._activate(this.selection[this.selection.length - 1]);
      } else {
        this._activate(null);
      }
    }
  }

  //
  cancel () {
    if ( !this.confirmed ) {
      super.select(this._confirmedSnapShot, true);

      this.confirmed = true;
      this._confirmedSnapShot = [];
    }
  }

  //
  clear () {
    super.clear();
    this.confirm();
  }
}

// ==========================
// init
// ==========================

let ipc = null;
if ( Platform.isMainProcess ) {
  ipc = Electron.ipcMain;
} else {
  ipc = Electron.ipcRenderer;
}

if ( Platform.isMainProcess ) {
  ipc.on( 'selection:get-registers', event => {
    let results = [];
    for ( let key in _helpers ) {
      let helper = _helpers[key];
      results.push({
        type: key,
        selection: helper.selection,
        lastActive: helper.lastActive,
        lastHover: helper.lastHover,
        context: helper._context,
        isLastGlobalActive: helper === _lastActiveHelper,
      });
    }
    event.returnValue = results;
  });
}

// NOTE: page-level init must before ipc, so that we will not recieve ipc-event before it
if ( Platform.isRendererProcess ) {
  (() => {
    let results = Ipc.sendToMainSync('selection:get-registers');
    for ( let i = 0; i < results.length; ++i ) {
      let info = results[i];
      if ( _helpers[info.type] ) {
        return;
      }

      let helper = new ConfirmableSelectionHelper(info.type);
      helper.selection = info.selection.slice();
      helper.lastActive = info.lastActive;
      helper.lastHover = info.lastHover;
      helper._context = info.context;

      _helpers[info.type] = helper;

      if ( info.isLastGlobalActive ) {
        _lastActiveHelper = helper;
      }
    }
  })();
}

// ==========================
// Ipc
// ==========================

// recv ipc message and update the local data

ipc.on( '_selection:selected', ( event, type, ids ) => {
  let helper = _helpers[type];
  if ( !helper ) {
    Console.error('Cannot find the type %s for selection. Please register it first.', type);
    return;
  }

  // NOTE: it is possible we recv messages from ourself
  ids = ids.filter(x => {
    return helper.selection.indexOf(x) === -1;
  });

  // NOTE: we don't consider message from multiple source, in that case
  //       even the data was right, the messages still goes wrong.
  if (ids.length === 1) {
    helper.selection.push(ids[0]);
  }
  else if (ids.length > 1) {
    // NOTE: push.apply has limitation in item counts
    helper.selection = helper.selection.concat(ids);
  }
});

ipc.on( '_selection:unselected', ( event, type, ids ) => {
  let helper = _helpers[type];
  if ( !helper ) {
    Console.error('Cannot find the type %s for selection. Please register it first.', type);
    return;
  }

  helper.selection = helper.selection.filter(x => {
    return ids.indexOf(x) === -1;
  });
});

ipc.on( '_selection:activated', ( event, type, id ) => {
  let helper = _helpers[type];
  if ( !helper ) {
    Console.error('Cannot find the type %s for selection. Please register it first.', type);
    return;
  }

  _lastActiveHelper = helper;
  helper.lastActive = id;
});

ipc.on( '_selection:deactivated', ( event, type, id ) => {
  unused(id);

  let helper = _helpers[type];
  if ( !helper ) {
    Console.error('Cannot find the type %s for selection. Please register it first.', type);
    return;
  }

  if ( _lastActiveHelper === helper ) {
    _lastActiveHelper = null;
  }
  helper.lastActive = null;
});

ipc.on( '_selection:hoverin', ( event, type, id ) => {
  let helper = _helpers[type];
  if ( !helper ) {
    Console.error('Cannot find the type %s for selection. Please register it first.', type);
    return;
  }

  helper.lastHover = id;
});

ipc.on( '_selection:hoverout', ( event, type, id ) => {
  unused(id);

  let helper = _helpers[type];
  if ( !helper ) {
    Console.error('Cannot find the type %s for selection. Please register it first.', type);
    return;
  }

  helper.lastHover = null;
});

ipc.on( '_selection:context', ( event, type, id ) => {
  let helper = _helpers[type];
  if ( !helper ) {
    Console.error('Cannot find the type %s for selection. Please register it first.', type);
    return;
  }

  helper._context = id;
});

ipc.on( '_selection:patch', ( event, type, srcID, destID ) => {
  let helper = _helpers[type];
  if ( !helper ) {
    Console.error('Cannot find the type %s for selection. Please register it first.', type);
    return;
  }

  //
  let idx = helper.selection.indexOf(srcID);
  if ( idx !== -1 ) {
    helper.selection[idx] = destID;
  }
  if ( helper.lastActive === srcID ) {
    helper.lastActive = destID;
  }
  if ( helper.lastHover === srcID ) {
    helper.lastHover = destID;
  }
  if ( helper._context === srcID ) {
    helper._context = destID;
  }
});
