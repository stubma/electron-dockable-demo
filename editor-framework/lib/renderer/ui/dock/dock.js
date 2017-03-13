'use strict';

const JS = require('../../../share/js-utils');
const DockResizer = require('./resizer');
const DomUtils = require('../utils/dom-utils');
const Resizable = require('../behaviors/resizable');
const Dockable = require('../behaviors/dockable');

// ==========================
// exports
// ==========================

class Dock extends window.HTMLElement {
  static get tagName () { return 'UI-DOCK'; }

  /**
   * @property row
   */
  get row () {
    return this.getAttribute('row') !== null;
  }
  set row (val) {
    if (val) {
      this.setAttribute('row', '');
    } else {
      this.removeAttribute('row');
    }
  }

  /**
   * @property noCollapse
   */
  get noCollapse () {
    return this.getAttribute('no-collapse') !== null;
  }
  set noCollapse (val) {
    if (val) {
      this.setAttribute('no-collapse', '');
    } else {
      this.removeAttribute('no-collapse');
    }
  }

  createdCallback () {
    let root = this.createShadowRoot();
    root.innerHTML = `
      <div class="content">
        <content select="ui-dock,ui-dock-panel,ui-dock-resizer"></content>
      </div>
    `;
    root.insertBefore(
      DomUtils.createStyleElement('theme://elements/dock.css'),
      root.firstChild
    );

    if ( this.minWidth === null ) { this.minWidth = 10; }
    if ( this.minHeight === null ) { this.minHeight = 10; }

    // init behaviors
    this._initDockable();
    this._initResizable();

    // init resizer
    this._initResizers();
  }

  _initResizers () {
    if ( this.children.length > 1 ) {
      for ( let i = 0; i < this.children.length; ++i ) {
        if ( i !== this.children.length-1 ) {
          // var el = this.children[i];
          let nextEL = this.children[i+1];

          let resizer = document.createElement('ui-dock-resizer');
          resizer.vertical = this.row;

          this.insertBefore( resizer, nextEL );
          i += 1;
        }
      }
    }
  }

  _collapseRecursively () {
    // let elements = [];
    for ( let i = 0; i < this.children.length; i += 2 ) {
      let el = this.children[i];

      if ( el._dockable ) {
        el._collapseRecursively();
      }
    }

    this.collapse();
  }

  // depth first calculate the width and height
  _finalizeSizeRecursively ( reset ) {
    let elements = [];

    for ( let i = 0; i < this.children.length; i += 2 ) {
      let el = this.children[i];

      if ( el._dockable ) {
        el._finalizeSizeRecursively(reset);
        elements.push(el);
      }
    }

    //
    this.finalizeSize(elements,reset);
  }

  // depth first calculate the min max width and height
  _finalizeMinMaxRecursively () {
    let elements = [];

    for ( let i = 0; i < this.children.length; i += 2 ) {
      let el = this.children[i];

      if ( el._dockable ) {
        el._finalizeMinMaxRecursively();
        elements.push(el);
      }
    }

    //
    this.finalizeMinMax(elements, this.row);
  }

  _finalizeStyleRecursively () {
    // let elements = [];

    // NOTE: finalizeStyle is breadth first calculation, because we need to make sure
    //       parent style applied so that the children would not calculate wrong.
    this.finalizeStyle();

    //
    for ( let i = 0; i < this.children.length; i += 2 ) {
      let el = this.children[i];

      if ( el._dockable ) {
        el._finalizeStyleRecursively();
      }
    }

    //
    this.reflow();
  }

  finalizeStyle () {
    // var resizerCnt = (this.children.length - 1)/2;
    // var resizerSize = resizerCnt * resizerSpace;

    // let hasAutoLayout = false;

    if ( this.children.length === 1 ) {
      let el = this.children[0];

      el.style.flex = '1 1 auto';
      // hasAutoLayout = true;
    } else {
      for ( let i = 0; i < this.children.length; i += 2 ) {
        let el = this.children[i];
        let size;

        if ( this.row ) {
          size = el.curWidth;
        } else {
          size = el.curHeight;
        }

        if ( size === 'auto' ) {
          // hasAutoLayout = true;
          el.style.flex = '1 1 auto';
        } else {
          // // if this is last el and we don't have auto-layout elements, give rest size to last el
          // if ( i === (this.children.length-1) && !hasAutoLayout ) {
          //   el.style.flex = "1 1 auto";
          // }
          // else {
          //   el.style.flex = "0 0 " + size + "px";
          // }
          el.style.flex = `0 0 ${size}px`;
        }
      }
    }
  }

  reflow () {
    let sizeList = [];
    let totalSize = 0;

    // let parentRect = this.getBoundingClientRect();

    for ( let i = 0; i < this.children.length; ++i ) {
      let el = this.children[i];
      let size = this.row ? el.offsetWidth : el.offsetHeight;

      sizeList.push(size);
      if ( el.tagName === DockResizer.tagName ) {
        continue;
      }
      totalSize += size;
    }

    for ( let i = 0; i < this.children.length; ++i ) {
      let el = this.children[i];
      if ( el.tagName === DockResizer.tagName ) {
        continue;
      }

      let ratio = sizeList[i]/totalSize;
      el.style.flex = `${ratio} ${ratio} ${sizeList[i]}px`;

      if ( this.row ) {
        el.curWidth = sizeList[i];
        // el.curHeight = parentRect.height; // DISABLE, disable this can store the last used height
      } else {
        // el.curWidth = parentRect.width; // DISABLE, disable this can store the last used height
        el.curHeight = sizeList[i];
      }
    }
  }
}

JS.addon(Dock.prototype, Resizable, Dockable);

module.exports = Dock;
