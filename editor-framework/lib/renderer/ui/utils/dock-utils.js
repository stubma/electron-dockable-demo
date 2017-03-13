'use strict';

let DockUtils = {};
module.exports = DockUtils;

// requires
const Electron = require('electron');
const Async = require('async');

const Ipc = require('../../ipc');
const Panel = require('../../panel');
const Window = require('../../window');
const DomUtils = require('./dom-utils');

const _resizerSpace = 3; // 3 is resizer size

let _resultDock = null;
let _potentialDocks = [];
let _dockMask = null;

let _dragenterCnt = 0;
let _draggingInfo = null;

let _layouting = false;

// ==========================
// exports
// ==========================

/**
 * @property root
 */
DockUtils.root = null;

/**
 * @property resizerSpace
 */
DockUtils.resizerSpace = _resizerSpace;

DockUtils.dragstart = function ( dataTransfer, tabEL ) {
  dataTransfer.setData('editor/type', 'tab');

  let frameEL = tabEL.frameEL;
  let panelID = frameEL.getAttribute('id');
  let panelEL = frameEL.parentNode;
  let panelRect = panelEL.getBoundingClientRect();

  _draggingInfo = {
    panelID: panelID,
    panelRectWidth: panelRect.width,
    panelRectHeight: panelRect.height,

    panelWidth: panelEL.width,
    panelHeight: panelEL.height,
    panelComputedWidth: panelEL.computedWidth,
    panelComputedHeight: panelEL.computedHeight,
    panelCurWidth: panelEL.curWidth,
    panelCurHeight: panelEL.curHeight,

    panelMinWidth: panelEL.minWidth,
    panelMinHeight: panelEL.minHeight,
    panelMaxWidth: panelEL.maxWidth,
    panelMaxHeight: panelEL.maxHeight,

    parentDockRow: panelEL.parentNode.row,
  };

  if ( Ipc.sendToWins ) {
    Ipc.sendToWins('editor:panel-dragstart', _draggingInfo, Ipc.option({
      excludeSelf: true
    }));
    Ipc.sendToWins('editor:dragstart');
  }
};

DockUtils.getFrameSize = function ( frameEL, prop ) {
  let sizeAttr = frameEL.getAttribute(prop);

  if ( sizeAttr !== 'auto' ) {
    sizeAttr = parseInt(sizeAttr);
    sizeAttr = isNaN(sizeAttr) ? 200 : sizeAttr;
  }

  return sizeAttr;
};

DockUtils.dragoverTab = function ( target ) {
  if ( !_draggingInfo ) {
    return;
  }

  Window.focus();

  // clear docks hints
  _potentialDocks = [];
  _resultDock = null;

  if ( _dockMask ) {
    _dockMask.remove();
  }

  let rect = target.getBoundingClientRect();
  _updateMask ( 'tab', rect.left, rect.top, rect.width, rect.height+2 );
};

DockUtils.dropTab = function ( target, insertBeforeTabEL ) {
  if ( !_draggingInfo ) {
    return;
  }

  let panelID = _draggingInfo.panelID;
  let frameEL = Panel.find(panelID);

  if ( frameEL ) {
    let panelEL = frameEL.parentNode;
    let targetPanelEL = target.panelEL;

    let needCollapse = panelEL !== targetPanelEL;
    let currentTabEL = panelEL.$.tabs.findTab(frameEL);

    if ( needCollapse ) {
      panelEL.closeNoCollapse(currentTabEL);
    }

    //
    let idx = targetPanelEL.insert( currentTabEL, frameEL, insertBeforeTabEL );
    targetPanelEL.select(idx);

    if ( needCollapse ) {
      panelEL.collapse();
    }

    // reset internal states
    _reset();

    //
    DockUtils.flush();
    DockUtils.saveLayout();

    // NOTE: you must focus after DockUtils flushed
    // NOTE: do not use panelEL focus, the activeTab is still not assigned
    frameEL.focus();
    if ( Panel.isDirty(frameEL.getAttribute('id')) ) {
      targetPanelEL.outOfDate(frameEL);
    }
  } else {
    Panel.close(panelID);

    Panel.load( panelID, ( err, frameEL ) => {
      if ( err ) {
        Editor.error(err.stack);
        return;
      }

      window.requestAnimationFrame ( () => {
        let targetPanelEL = target.panelEL;
        let newTabEL = document.createElement('ui-dock-tab');
        newTabEL.name = frameEL.getAttribute('name');

        let idx = targetPanelEL.insert( newTabEL, frameEL, insertBeforeTabEL );
        targetPanelEL.select(idx);

        // reset internal states
        _reset();

        //
        DockUtils.flush();
        DockUtils.saveLayout();

        // NOTE: you must focus after DockUtils flushed
        // NOTE: do not use panelEL focus, the activeTab is still not assigned
        frameEL.focus();
        if ( Panel.isDirty(frameEL.getAttribute('id')) ) {
          targetPanelEL.outOfDate(frameEL);
        }
      });
    });
  }
};

DockUtils.dragoverDock = function ( target ) {
  if ( !_draggingInfo ) {
    return;
  }

  _potentialDocks.push(target);
};

DockUtils.reset = function () {
  if ( !DockUtils.root ) {
    return;
  }

  if ( DockUtils.root._dockable ) {
    this.root._finalizeSizeRecursively(true);
    this.root._finalizeMinMaxRecursively();
    this.root._finalizeStyleRecursively();
    this.root._notifyResize();
  } else {
    // NOTE: non-dockable panel is a single panel frame
    DomUtils.fire(DockUtils.root, 'panel-resize');
  }
};

DockUtils.flushWithCollapse = function () {
  this.root._collapseRecursively();

  if ( !DockUtils.root ) {
    return;
  }

  if ( DockUtils.root._dockable ) {
    this.root._finalizeSizeRecursively(false);
    this.root._finalizeMinMaxRecursively();
    this.root._finalizeStyleRecursively();
    this.root._notifyResize();
  } else {
    // NOTE: non-dockable panel is a single panel frame
    DomUtils.fire(DockUtils.root, 'panel-resize');
  }
};

DockUtils.flush = function () {
  if ( !DockUtils.root ) {
    return;
  }

  if ( DockUtils.root._dockable ) {
    this.root._finalizeMinMaxRecursively();
    this.root._finalizeStyleRecursively();
    this.root._notifyResize();
  } else {
    // NOTE: non-dockable panel is a single panel frame
    DomUtils.fire(DockUtils.root, 'panel-resize');
  }
};

DockUtils.reflow = function () {
  if ( !DockUtils.root ) {
    return;
  }

  if ( DockUtils.root._dockable ) {
    DockUtils.root._reflowRecursively();
    DockUtils.root._notifyResize();
  } else {
    // NOTE: non-dockable panel is a single panel frame
    DomUtils.fire(DockUtils.root, 'panel-resize');
  }
};

DockUtils.createLayout = function ( parentEL, layoutInfo ) {
  let importList = [];

  // if we have root, clear all children in it
  let rootEL = DockUtils.root;
  if ( rootEL ) {
    rootEL.remove();
    DockUtils.root = null;
  }

  rootEL = document.createElement('ui-dock');
  rootEL.classList.add('fit');
  rootEL.setAttribute('no-collapse', '');

  if ( layoutInfo ) {
    if ( layoutInfo.row ) {
      rootEL.setAttribute('row', '');
    }

    _createLayouts( rootEL, layoutInfo.docks, importList );
  }

  parentEL.appendChild(rootEL);
  DockUtils.root = rootEL;

  return importList;
};

DockUtils.loadLayout = function ( anchorEL, cb ) {
  Ipc.sendToMain( 'editor:window-query-layout', (err, layout, needReset) => {
    if ( !layout ) {
      if (cb) {
        cb ( false );
      }
      return;
    }

    // NOTE: needReset implies this is a default layout
    DockUtils.resetLayout( anchorEL, layout, (err) => {
      if (cb) {
        cb ( err ? false : needReset );
      }
    });
  });
};

DockUtils.resetLayout = function ( anchorEL, layoutInfo, cb ) {
  _layouting = true;

  Panel.closeAll((err) => {
    if ( err ) {
      if ( cb ) {
        cb ( err );
      }
      return;
    }

    let importList = DockUtils.createLayout( anchorEL, layoutInfo );
    Async.each( importList, ( item, done ) => {
      Panel.load (item.panelID, ( err, frameEL ) => {
        if ( err ) {
          Editor.error(err.stack);
          done();
          return;
        }

        let dockAt = item.dockEL;
        dockAt.add(frameEL);
        if ( item.active ) {
          dockAt.select(frameEL);
        }
        done();
      });
    }, err => {
      _layouting = false;

      // close error panels
      DockUtils.flushWithCollapse();
      DockUtils.saveLayout();
      if ( cb ) {
        cb ( err );
      }
    });
  });
};

DockUtils.saveLayout = function () {
  // don't save layout when we are layouting
  if ( _layouting ) {
    return;
  }

  window.requestAnimationFrame ( () => {
    Ipc.sendToMain('editor:window-save-layout', Panel.dumpLayout());
  });
};

// ==========================
// Internal
// ==========================

function _createLayouts ( parentEL, infos, importList ) {
  for ( let i = 0; i < infos.length; ++i ) {
    let info = infos[i];

    let el;

    if ( info.type === 'dock' ) {
      el = document.createElement('ui-dock');
    } else if ( info.type === 'panel' ) {
      el = document.createElement('ui-dock-panel');
    }

    if ( !el ) {
      continue;
    }

    if ( info.row !== undefined ) {
      el.row = info.row;
    }

    if ( info.width !== undefined ) {
      el.curWidth = info.width;
    }

    if ( info.height !== undefined ) {
      el.curHeight = info.height;
    }

    if ( info.docks ) {
      _createLayouts ( el, info.docks, importList );
    } else if ( info.panels ) {
      for ( var j = 0; j < info.panels.length; ++j ) {
        importList.push( { dockEL: el, panelID: info.panels[j], active: j === info.active } );
      }
    }

    parentEL.appendChild(el);
  }
  parentEL._initResizers();
}

function _updateMask ( type, x, y, w, h ) {
  if ( !_dockMask ) {
    // add dock mask
    _dockMask = document.createElement('div');
    _dockMask.classList.add('dock-mask');
    _dockMask.oncontextmenu = function() { return false; };
  }

  if ( type === 'dock' ) {
    _dockMask.classList.remove('tab');
    _dockMask.classList.add('dock');
  } else if ( type === 'tab' ) {
    _dockMask.classList.remove('dock');
    _dockMask.classList.add('tab');
  }

  _dockMask.style.left = x + 'px';
  _dockMask.style.top = y + 'px';
  _dockMask.style.width = w + 'px';
  _dockMask.style.height = h + 'px';

  if ( !_dockMask.parentElement ) {
    document.body.appendChild(_dockMask);
  }
}

function _reset () {
  if ( _dockMask ) {
    _dockMask.remove();
  }

  _resultDock = null;
  _dragenterCnt = 0;
  _draggingInfo = null;
}

// ==========================
// Ipc
// ==========================

const ipcRenderer = Electron.ipcRenderer;

ipcRenderer.on('editor:panel-dragstart', ( event, info ) => {
  _draggingInfo = info;
});

ipcRenderer.on('editor:panel-dragend', () => {
  _reset();
});

ipcRenderer.on('editor:reset-layout', (event, layoutInfo) => {
  let anchorEL = document.body;
  if ( DockUtils.root ) {
    anchorEL = DockUtils.root.parentNode;
  }

  DockUtils.resetLayout( anchorEL, layoutInfo, (err) => {
    if ( !err ) {
      DockUtils.reset();
    }
  });
});

// ==========================
// Dom
// ==========================

window.addEventListener('resize', () => {
  DockUtils.reflow();
});

document.addEventListener('dragenter', event => {
  if ( !_draggingInfo ) {
    return;
  }

  event.stopPropagation();
  ++_dragenterCnt;
});

document.addEventListener('dragleave', event => {
  if ( !_draggingInfo ) {
    return;
  }

  event.stopPropagation();
  --_dragenterCnt;

  if ( _dragenterCnt === 0 ) {
    if ( _dockMask ) {
      _dockMask.remove();
    }
  }
});

document.addEventListener('dragover', event => {
  if ( !_draggingInfo ) {
    return;
  }

  event.dataTransfer.dropEffect = 'move';
  event.preventDefault();

  Window.focus();

  let minDistance = null;
  _resultDock = null;

  for ( let i = 0; i < _potentialDocks.length; ++i ) {
    let hintTarget = _potentialDocks[i];
    let targetRect = hintTarget.getBoundingClientRect();
    let center_x = targetRect.left + targetRect.width/2;
    let center_y = targetRect.top + targetRect.height/2;
    let pos = null;

    let leftDist = Math.abs(event.x - targetRect.left);
    let rightDist = Math.abs(event.x - targetRect.right);
    let topDist = Math.abs(event.y - targetRect.top);
    let bottomDist = Math.abs(event.y - targetRect.bottom);
    let minEdge = 100;
    let distanceToEdgeCenter = -1;

    if ( leftDist < minEdge ) {
      minEdge = leftDist;
      distanceToEdgeCenter = Math.abs(event.y - center_y);
      pos = 'left';
    }

    if ( rightDist < minEdge ) {
      minEdge = rightDist;
      distanceToEdgeCenter = Math.abs(event.y - center_y);
      pos = 'right';
    }

    if ( topDist < minEdge ) {
      minEdge = topDist;
      distanceToEdgeCenter = Math.abs(event.x - center_x);
      pos = 'top';
    }

    if ( bottomDist < minEdge ) {
      minEdge = bottomDist;
      distanceToEdgeCenter = Math.abs(event.x - center_x);
      pos = 'bottom';
    }

    //
    if ( pos !== null && (minDistance === null || distanceToEdgeCenter < minDistance) ) {
      minDistance = distanceToEdgeCenter;
      _resultDock = { target: hintTarget, position: pos };
    }
  }

  if ( _resultDock ) {
    let rect = _resultDock.target.getBoundingClientRect();
    let maskRect = null;

    let panelComputedWidth = _draggingInfo.panelComputedWidth;
    let panelComputedHeight = _draggingInfo.panelComputedHeight;
    let panelRectWidth = _draggingInfo.panelRectWidth;
    let panelRectHeight = _draggingInfo.panelRectHeight;

    let hintWidth = panelComputedWidth === 'auto' ? rect.width/2 : panelRectWidth;
    hintWidth = Math.min( hintWidth, Math.min( rect.width/2, 200 ) );

    let hintHeight = panelComputedHeight === 'auto' ? rect.height/2 : panelRectHeight;
    hintHeight = Math.min( hintHeight, Math.min( rect.height/2, 200 ) );

    if ( _resultDock.position === 'top' ) {
      maskRect = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: hintHeight,
      };
    } else if ( _resultDock.position === 'bottom' ) {
      maskRect = {
        left: rect.left,
        top: rect.bottom-hintHeight,
        width: rect.width,
        height: hintHeight
      };
    } else if ( _resultDock.position === 'left' ) {
      maskRect = {
        left: rect.left,
        top: rect.top,
        width: hintWidth,
        height: rect.height
      };
    } else if ( _resultDock.position === 'right' ) {
      maskRect = {
        left: rect.right-hintWidth,
        top: rect.top,
        width: hintWidth,
        height: rect.height
      };
    }

    //
    _updateMask ( 'dock', maskRect.left, maskRect.top, maskRect.width, maskRect.height );
  } else {
    if ( _dockMask ) {
      _dockMask.remove();
    }
  }

  _potentialDocks = [];
});

document.addEventListener('dragend', () => {
  // reset internal states
  _reset();
  if ( Ipc.sendToWins ) {
    Ipc.sendToWins( 'editor:panel-dragend', Ipc.option({
      excludeSelf: true
    }));
    Ipc.sendToWins( 'editor:dragend' );
  }
});

document.addEventListener('drop', event => {
  if ( Ipc.sendToWins ) {
    Ipc.sendToWins( 'editor:dragend' );
  }

  event.preventDefault();
  event.stopPropagation();

  if ( _resultDock === null ) {
    return;
  }

  let panelID = _draggingInfo.panelID;
  let panelRectWidth = _draggingInfo.panelRectWidth;
  let panelRectHeight = _draggingInfo.panelRectHeight;

  let panelWidth = _draggingInfo.panelWidth;
  let panelHeight = _draggingInfo.panelHeight;
  let panelComputedWidth = _draggingInfo.panelComputedWidth;
  let panelComputedHeight = _draggingInfo.panelComputedHeight;
  let panelCurWidth = _draggingInfo.panelCurWidth;
  let panelCurHeight = _draggingInfo.panelCurHeight;

  let panelMinWidth = _draggingInfo.panelMinWidth;
  let panelMinHeight = _draggingInfo.panelMinHeight;
  let panelMaxWidth = _draggingInfo.panelMaxWidth;
  let panelMaxHeight = _draggingInfo.panelMaxHeight;

  let parentDockRow = _draggingInfo.parentDockRow;

  let targetDockEL = _resultDock.target;
  let dockPosition = _resultDock.position;

  let frameEL = Panel.find(panelID);
  if ( !frameEL ) {
    Panel.close(panelID);

    Panel.load( panelID, ( err, frameEL ) => {
      if ( err ) {
        Editor.error(err.stack);
        return;
      }

      window.requestAnimationFrame (() => {
        let newPanel = document.createElement('ui-dock-panel');
        newPanel.width = panelWidth;
        newPanel.height = panelHeight;
        newPanel.minWidth = panelMinWidth;
        newPanel.maxWidth = panelMaxWidth;
        newPanel.minHeight = panelMinHeight;
        newPanel.maxHeight = panelMaxHeight;

        // NOTE: here must use frameEL's width, height attribute to determine computed size
        let elWidth = DockUtils.getFrameSize( frameEL, 'width');
        newPanel.computedWidth = elWidth === 'auto' ? 'auto' : panelComputedWidth;

        let elHeight = DockUtils.getFrameSize( frameEL, 'height');
        newPanel.computedHeight = elHeight === 'auto' ? 'auto' : panelComputedHeight;

        // if parent is row, the height will be ignore
        if ( parentDockRow ) {
          newPanel.curWidth = newPanel.computedWidth === 'auto' ? 'auto' : panelRectWidth;
          newPanel.curHeight = newPanel.computedHeight === 'auto' ? 'auto' : panelCurHeight;
        }
        // else if parent is column, the width will be ignore
        else {
          newPanel.curWidth = newPanel.computedWidth === 'auto' ? 'auto' : panelCurWidth;
          newPanel.curHeight = newPanel.computedHeight === 'auto' ? 'auto' : panelRectHeight;
        }

        newPanel.add(frameEL);
        newPanel.select(0);

        //
        targetDockEL.addDock( dockPosition, newPanel );

        // reset internal states
        _reset();

        //
        DockUtils.flush();
        DockUtils.saveLayout();

        // NOTE: you must focus after DockUtils flushed
        // NOTE: do not use panelEL focus, the activeTab is still not assigned
        frameEL.focus();
        if ( Panel.isDirty(frameEL.getAttribute('id')) ) {
          newPanel.outOfDate(frameEL);
        }
      });
    });

    return;
  }

  let panelEL = frameEL.parentNode;

  if (
    targetDockEL === panelEL &&
    targetDockEL.tabCount === 1
  ) {
    return;
  }

  let parentDock = panelEL.parentNode;

  //
  let currentTabEL = panelEL.$.tabs.findTab(frameEL);
  panelEL.closeNoCollapse(currentTabEL);

  //
  let newPanel = document.createElement('ui-dock-panel');
  newPanel.width = panelWidth;
  newPanel.height = panelHeight;
  newPanel.minWidth = panelMinWidth;
  newPanel.maxWidth = panelMaxWidth;
  newPanel.minHeight = panelMinHeight;
  newPanel.maxHeight = panelMaxHeight;

  // NOTE: here must use frameEL's width, height attribute to determine computed size
  let elWidth = DockUtils.getFrameSize( frameEL, 'width');
  newPanel.computedWidth = elWidth === 'auto' ? 'auto' : panelComputedWidth;

  let elHeight = DockUtils.getFrameSize( frameEL, 'height');
  newPanel.computedHeight = elHeight === 'auto' ? 'auto' : panelComputedHeight;

  // if parent is row, the height will be ignore
  if ( parentDock.row ) {
    newPanel.curWidth = newPanel.computedWidth === 'auto' ? 'auto' : panelRectWidth;
    newPanel.curHeight = newPanel.computedHeight === 'auto' ? 'auto' : panelCurHeight;
  }
  // else if parent is column, the width will be ignore
  else {
    newPanel.curWidth = newPanel.computedWidth === 'auto' ? 'auto' : panelCurWidth;
    newPanel.curHeight = newPanel.computedHeight === 'auto' ? 'auto' : panelRectHeight;
  }

  newPanel.add(frameEL);
  newPanel.select(0);

  //
  targetDockEL.addDock( dockPosition, newPanel );

  //
  let totallyRemoved = panelEL.children.length === 0;
  panelEL.collapse();

  // if we totally remove the panelEL, check if targetDock has the ancient as panelEL does
  // if that is true, add parentEL's size to targetDock's flex style size
  if ( totallyRemoved ) {
    let hasSameAncient = false;

    // if newPanel and oldPanel have the same parent, don't do the calculation.
    // it means newPanel just move under the same parent dock in same direction.
    if ( newPanel.parentNode !== parentDock ) {
      let sibling = newPanel;
      let newParent = newPanel.parentNode;

      while ( newParent && newParent._dockable ) {
        if ( newParent === parentDock ) {
          hasSameAncient = true;
          break;
        }

        sibling = newParent;
        newParent = newParent.parentNode;
      }

      if ( hasSameAncient ) {
        let size = 0;

        if ( parentDock.row ) {
          size = sibling.curWidth + _resizerSpace + panelCurWidth;
          sibling.curWidth = size;
        } else {
          size = sibling.curHeight + _resizerSpace + panelCurHeight;
          sibling.curHeight = size;
        }

        sibling.style.flex = `0 0 ${size}px`;
      }
    }
  }

  // reset internal states
  _reset();

  //
  DockUtils.flush();
  DockUtils.saveLayout();

  // NOTE: you must focus after DockUtils flushed
  // NOTE: do not use panelEL focus, the activeTab is still not assigned
  frameEL.focus();
  if ( Panel.isDirty(frameEL.getAttribute('id')) ) {
    newPanel.outOfDate(frameEL);
  }
});
