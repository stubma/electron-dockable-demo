'use strict';

const DomUtils = require('../utils/dom-utils');
const DragDrop = require('../utils/drag-drop');

// ==========================
// exports
// ==========================

let Droppable = {
  /**
   * @property droppable
   */
  get droppable () {
    return this.getAttribute('droppable');
  },
  set droppable (val) {
    this.setAttribute('droppable', val);
  },

  /**
   * @property singleDrop
   */
  get singleDrop () {
    return this.getAttribute('single-drop') !== null;
  },
  set singleDrop (val) {
    if (val) {
      this.setAttribute('single-drop', '');
    } else {
      this.removeAttribute('single-drop');
    }
  },

  _initDroppable ( dropAreaElement ) {
    this._dragenterCnt = 0;

    dropAreaElement.addEventListener('dragenter', event => {
      event.stopPropagation();

      ++this._dragenterCnt;

      if ( this._dragenterCnt === 1 ) {
        this.checkIfDroppable(event.dataTransfer, ( droppable, dragType, dragItems ) => {
          if ( !droppable ) {
            return;
          }

          DomUtils.fire(event.target, 'drop-area-enter', {
            bubbles: true,
            detail: {
              dragType: dragType,
              dragItems: dragItems,
              dataTransfer: event.dataTransfer,
            }
          });
        });
      }
    });

    dropAreaElement.addEventListener('dragleave', event => {
      event.stopPropagation();

      --this._dragenterCnt;

      if ( this._dragenterCnt === 0 ) {
        this.checkIfDroppable( event.dataTransfer, ( droppable, dragType, dragItems ) => {
          if ( !droppable ) {
            return;
          }

          DomUtils.fire(event.target, 'drop-area-leave', {
            bubbles: true,
            detail: {
              dragType: dragType,
              dragItems: dragItems,
              dataTransfer: event.dataTransfer,
            }
          });
        });
      }
    });

    dropAreaElement.addEventListener('drop', event => {
      this._dragenterCnt = 0;

      this.checkIfDroppable( event.dataTransfer, ( droppable, dragType, dragItems ) => {
        if ( !droppable ) {
          return;
        }

        event.preventDefault(); // Necessary. Allows us to control the drop
        event.stopPropagation();

        DragDrop.end();

        DomUtils.fire(event.target, 'drop-area-accept', {
          bubbles: true,
          detail: {
            dragType: dragType,
            dragItems: dragItems,
            dataTransfer: event.dataTransfer,
            clientX: event.clientX,
            clientY: event.clientY,
            offsetX: event.offsetX,
            offsetY: event.offsetY,
            // DELME & DISABLE: use Polymer.dom(event) in 'drop-area-accept' instead
            // dropTarget: Polymer.dom(event).localTarget,
          }
        });
      });
    });

    // dropAreaElement.addEventListener( 'dragover', event => {
    //   event.preventDefault(); // Necessary. Allows us to control the drop.
    //   event.stopPropagation();

    //   this.checkIfDroppable( event.dataTransfer, ( droppable, dragType, dragItems ) => {
    //     if ( !droppable ) {
    //       return;
    //     }

    //     this.fire('drop-area-dragover', {
    //       dragType: dragType,
    //       dragItems: dragItems,
    //       dataTransfer: event.dataTransfer
    //     });
    //   });
    // });
  },

  checkIfDroppable ( dataTransfer, fn ) {
    let droppableList = [];
    if ( this.droppable !== null ) {
      droppableList = this.droppable.split(',');
    }
    let dragType = DragDrop.type(dataTransfer);

    let found = false;
    for ( let i = 0; i < droppableList.length; ++i ) {
      if ( dragType === droppableList[i] ) {
        found = true;
        break;
      }
    }

    if ( !found ) {
      fn.call( this, false, dragType, [] );
      return;
    }

    let dragItems = DragDrop.items(dataTransfer);
    if ( this.singleDrop && dragItems.length > 1 ) {
      fn.call( this, false, dragType, dragItems );
      return;
    }

    fn.call( this, true, dragType, dragItems );
  },
};

module.exports = Droppable;
