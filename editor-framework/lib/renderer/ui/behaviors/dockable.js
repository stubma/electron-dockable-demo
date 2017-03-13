'use strict';

const Console = require('../../console');
const DockUtils = require('../utils/dock-utils');
const DockResizer = require('../dock/resizer');

// ==========================
// exports
// ==========================

let Dockable = {
  _dockable: true,

  _initDockable () {
    this.addEventListener('dragover', this._onDragOver.bind(this));
  },

  _onDragOver ( event ) {
    event.preventDefault();

    DockUtils.dragoverDock( event.currentTarget );
  },

  // position: left, right, top, bottom
  addDock ( position, element ) {
    if ( element._dockable === false ) {
      Console.warn(`Dock element at position ${position} must be dockable`);
      return;
    }

    let needNewDock = false;
    let parentEL = this.parentNode;
    let elements = [];
    let newDock, newResizer, nextEL;
    let newWidth, newHeight;
    let rect = this.getBoundingClientRect();

    if ( parentEL._dockable ) {
      // check if need to create new Dock element
      if ( position === 'left' || position === 'right' ) {
        if ( !parentEL.row ) {
          needNewDock = true;
        }
        newWidth = Math.max( 0, rect.width-element.curWidth-DockUtils.resizerSpace );
      } else {
        if ( parentEL.row ) {
          needNewDock = true;
        }
        newHeight = Math.max( 0, rect.height-element.curHeight-DockUtils.resizerSpace );
      }

      // process dock
      if ( needNewDock ) {
        // new <ui-dock>
        newDock = document.createElement('ui-dock');

        if ( position === 'left' || position === 'right' ) {
          newDock.row = true;
        } else {
          newDock.row = false;
        }

        //
        parentEL.insertBefore(newDock, this);

        //
        if ( position === 'left' || position === 'top' ) {
          newDock.appendChild(element);
          newDock.appendChild(this);
          elements = [element,this];
        } else {
          newDock.appendChild(this);
          newDock.appendChild(element);
          elements = [this,element];
        }

        //
        newDock.style.flex = this.style.flex;
        newDock._initResizers();
        newDock.finalizeSize(elements,true);
        newDock.curWidth = this.curWidth;
        newDock.curHeight = this.curHeight;
      } else {
        // new resizer
        newResizer = null;
        // newResizer = new DockResizer();
        newResizer = document.createElement('ui-dock-resizer');
        newResizer.vertical = parentEL.row;

        //
        if ( position === 'left' || position === 'top' ) {
          parentEL.insertBefore(element, this);
          parentEL.insertBefore(newResizer, this);
        } else {
          // insert after
          nextEL = this.nextElementSibling;
          if ( nextEL === null ) {
            parentEL.appendChild(newResizer);
            parentEL.appendChild(element);
          } else {
            parentEL.insertBefore(newResizer, nextEL);
            parentEL.insertBefore(element, nextEL);
          }
        }
      }

      // reset old panel's computed width, height
      this.style.flex = '';
      if ( this._applyFrameSize ) {
        this._applyFrameSize(false);
      }

      if ( position === 'left' || position === 'right' ) {
        if ( this.computedWidth !== 'auto' ) {
          this.curWidth = newWidth;
        }
      } else {
        if ( this.computedHeight !== 'auto' ) {
          this.curHeight = newHeight;
        }
      }
    }
    // if this is root panel
    else {
      if ( position === 'left' || position === 'right' ) {
        if ( !this.row ) {
          needNewDock = true;
        }
        newWidth = Math.max( 0, rect.width-element.curWidth-DockUtils.resizerSpace );
      } else {
        if ( this.row ) {
          needNewDock = true;
        }
        newHeight = Math.max( 0, rect.height-element.curHeight-DockUtils.resizerSpace );
      }

      // process dock
      if ( needNewDock ) {
        // new <ui-dock>
        newDock = document.createElement('ui-dock');
        newDock.row = this.row;

        if ( position === 'left' || position === 'right' ) {
          this.row = true;
        } else {
          this.row = false;
        }

        while ( this.children.length > 0 ) {
          let childEL = this.children[0];
          elements.push(childEL);
          newDock.appendChild(childEL);
        }

        newDock.style.flex = this.style.flex;
        newDock.finalizeSize(elements,true);
        newDock.curWidth = this.curWidth;
        newDock.curHeight = this.curHeight;

        // reset old panel's computed width, height
        this.style.flex = '';
        if ( this._applyFrameSize ) {
          this._applyFrameSize(false);
        }

        if ( position === 'left' || position === 'right' ) {
          if ( this.computedWidth !== 'auto' ) {
            this.curWidth = newWidth;
          }
        } else {
          if ( this.computedHeight !== 'auto' ) {
            this.curHeight = newHeight;
          }
        }

        //
        if ( position === 'left' || position === 'top' ) {
          this.appendChild(element);
          this.appendChild(newDock);
        } else {
          this.appendChild(newDock);
          this.appendChild(element);
        }

        //
        this._initResizers();
      } else {
        // new resizer
        newResizer = null;
        // newResizer = new DockResizer();
        newResizer = document.createElement('ui-dock-resizer');
        newResizer.vertical = this.row;

        //
        if ( position === 'left' || position === 'top' ) {
          this.insertBefore(element, this.firstElementChild);
          this.insertBefore(newResizer, this.firstElementChild);
        } else {
          // insert after
          nextEL = this.nextElementSibling;
          if ( nextEL === null ) {
            this.appendChild(newResizer);
            this.appendChild(element);
          } else {
            this.insertBefore(newResizer, nextEL);
            this.insertBefore(element, nextEL);
          }
        }
      }
    }
  },

  removeDock ( childEL ) {
    let contains = false;

    for ( let i = 0; i < this.children.length; ++i ) {
      if ( this.children[i] === childEL ) {
        contains = true;
        break;
      }
    }

    if ( !contains ) {
      return false;
    }

    if ( this.children[0] === childEL ) {
      if ( childEL.nextElementSibling && childEL.nextElementSibling.tagName === DockResizer.tagName ) {
        this.removeChild(childEL.nextElementSibling);
      }
    } else {
      if ( childEL.previousElementSibling && childEL.previousElementSibling.tagName === DockResizer.tagName ) {
        this.removeChild(childEL.previousElementSibling);
      }
    }

    this.removeChild(childEL);

    // return if dock can be collapsed
    return this.collapse();
  },

  collapse () {
    if ( this.noCollapse ) {
      return false;
    }

    let parentEL = this.parentNode;

    // if we don't have any element in this panel
    if ( this.children.length === 0 ) {
      if ( parentEL._dockable ) {
        parentEL.removeDock(this);
      } else {
        parentEL.removeChild(this);
      }

      return true;
    }


    // if we only have one element in this panel
    if ( this.children.length === 1 ) {
      let childEL = this.children[0];

      // assign current style to it, also reset its computedSize
      childEL.style.flex = this.style.flex;
      if ( parentEL.row ) {
        childEL.curWidth = this.curWidth;
        childEL.curHeight = childEL.computedHeight === 'auto' ? 'auto' : this.curHeight;
      } else {
        childEL.curWidth = childEL.computedWidth === 'auto' ? 'auto' : this.curWidth;
        childEL.curHeight = this.curHeight;
      }

      parentEL.insertBefore( childEL, this );
      parentEL.removeChild(this);

      if ( childEL._dockable ) {
        childEL.collapse();
      }

      return true;
    }

    // if the parent dock direction is same as this panel
    if ( parentEL._dockable && parentEL.row === this.row ) {
      while ( this.children.length > 0 ) {
        parentEL.insertBefore( this.children[0], this );
      }
      parentEL.removeChild(this);

      return true;
    }

    return false;
  },

  _reflowRecursively () {
    for ( let i = 0; i < this.children.length; i += 2 ) {
      let el = this.children[i];

      if ( el._dockable ) {
        el._reflowRecursively();
      }
    }

    if ( this.reflow ) {
      this.reflow();
    }
  },
};

module.exports = Dockable;
