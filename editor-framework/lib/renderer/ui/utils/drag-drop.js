'use strict';

let DragDrop = {};
module.exports = DragDrop;

// requires
const Path = require('fire-path');
const Ipc = require('../../ipc');
const Console = require('../../console');

let _allowed = false;

// ==========================
// exports
// ==========================

DragDrop.start = function ( dataTransfer, effect, type, items ) {
  let ids = items.map(item => {
    return item.id;
  });
  dataTransfer.effectAllowed = effect;
  dataTransfer.dropEffect = 'none';
  // FIXME: https://github.com/atom/electron/issues/1276
  dataTransfer.setData('text', type);
  dataTransfer.setData('editor/type', type);
  dataTransfer.setData('editor/items', ids.join());

  let img = this.getDragIcon(items);
  dataTransfer.setDragImage(img, -10, 10);

  Ipc.sendToWins('editor:dragstart');
};

DragDrop.drop = function ( dataTransfer ) {
  let results = [];
  if ( _allowed ) {
    results = DragDrop.items(dataTransfer);
  }

  _allowed = false;

  return results;
};

DragDrop.end = function () {
  _allowed = false;
  Ipc.sendToWins('editor:dragend');
};

DragDrop.updateDropEffect = function ( dataTransfer, dropEffect ) {
  if ( ['copy', 'move', 'link', 'none'].indexOf(dropEffect) === -1 ) {
    Console.warn( 'dropEffect must be one of \'copy\', \'move\', \'link\' or \'none\'' );
    dataTransfer.dropEffect = 'none';
    return;
  }

  if ( _allowed ) {
    dataTransfer.dropEffect = dropEffect;
  } else {
    dataTransfer.dropEffect = 'none';
  }
};

DragDrop.allowDrop = function ( dataTransfer, allowed ) {
  _allowed = allowed;
  if ( !_allowed ) {
    dataTransfer.dropEffect = 'none';
  }
};

DragDrop.type = function ( dataTransfer ) {
  let type = dataTransfer.getData('editor/type');
  if ( type === '' && dataTransfer.files.length > 0 ) {
    return 'file';
  }

  return type;
};

DragDrop.items = function ( dataTransfer ) {
  let type = DragDrop.type(dataTransfer);
  let items;

  if ( type === 'file' ) {
    let files = dataTransfer.files;
    items = [];

    for ( let i = 0; i < files.length; ++i ) {
      let exists = false;

      // filter out sub file paths if we have Path module
      if ( Path ) {
        for ( let j = 0; j < items.length; ++j ) {
          if ( Path.contains( items[j], files[i].path ) ) {
            exists = true;
            break;
          }
        }
      }

      if ( !exists ) {
        items.push( files[i].path );
      }
    }
  } else {
    items = dataTransfer.getData('editor/items');
    if ( items !== '' ) {
      items = items.split(',');
    } else {
      items = [];
    }
  }

  return items;
};

// NOTE: The image will be blur in retina, still not find a solution.
DragDrop.getDragIcon = function (items) {
  let icon = new Image();
  let canvas = document.createElement('canvas');
  let imgPanel = canvas.getContext('2d');
  imgPanel.font = 'normal 12px Arial';
  imgPanel.fillStyle = 'white';

  let top = 0;
  for ( let i = 0; i < items.length; ++i ) {
    let item = items[i];
    if ( i <= 4 ) {
      // icon
      // NOTE: the icon may be broken, use naturalWidth detect this
      if (
        item.icon &&
        item.icon.naturalWidth !== undefined &&
        item.icon.naturalWidth !== 0
      ) {
        imgPanel.drawImage(item.icon,0,top,16,16);
      }
      // text
      imgPanel.fillText(item.name,20,top + 15);
      top += 15;
    } else {
      imgPanel.fillStyle = 'gray';
      imgPanel.fillText('[more...]',20,top + 15);

      break;
    }
  }

  icon.src = canvas.toDataURL();
  return icon;
};

Object.defineProperty(DragDrop, 'allowed', {
  enumerable: true,
  get () {
    return _allowed;
  },
});
