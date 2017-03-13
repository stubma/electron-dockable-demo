'use strict';

// requires
const DomUtils = require('../utils/dom-utils');
const DockUtils = require('../utils/dock-utils');
const FocusMgr = require('../utils/focus-mgr');
const Platform = require('../../../share/platform');

// ==========================
// exports
// ==========================

class DockResizer extends window.HTMLElement {
  static get tagName () { return 'UI-DOCK-RESIZER'; }

  createdCallback () {
    let root = this.createShadowRoot();
    root.innerHTML = `
      <div class="bar"></div>
    `;
    root.insertBefore(
      DomUtils.createStyleElement('theme://elements/resizer.css'),
      root.firstChild
    );

    if ( Platform.isWin32 ) {
      this.classList.add('platform-win');
    }

    this.addEventListener('mousedown', this._onMouseDown.bind(this));
  }

  /**
   * @property vertical
   */
  get vertical () {
    return this.getAttribute('vertical') !== null;
  }
  set vertical (val) {
    if (val) {
      this.setAttribute('vertical', '');
    } else {
      this.removeAttribute('vertical');
    }
  }

  /**
   * @property active
   */
  get active () {
    return this.getAttribute('active') !== null;
  }
  set active (val) {
    if (val) {
      this.setAttribute('active', '');
    } else {
      this.removeAttribute('active');
    }
  }

  _snapshot () {
    let parentEL = this.parentNode;

    let sizeList = [];
    let resizerIndex = -1;
    // var totalSize = -1;

    // DISABLE
    // get parent size
    // let rect = parentEL.getBoundingClientRect();

    // get element size
    for ( let i = 0; i < parentEL.children.length; ++i ) {
      let el = parentEL.children[i];
      if ( el === this ) {
        resizerIndex = i;
      }

      // DISABLE:
      // rect = el.getBoundingClientRect();
      // sizeList.push( Math.round(this.vertical ? rect.width : rect.height) );
      sizeList.push( this.vertical ? el.offsetWidth : el.offsetHeight );
    }

    //
    let prevTotalSize = 0;
    let prevMinSize = 0;
    let prevMaxSize = 0;
    let nextTotalSize = 0;
    let nextMinSize = 0;
    let nextMaxSize = 0;

    for ( let i = 0; i < resizerIndex; i += 2 ) {
      prevTotalSize += sizeList[i];
      prevMinSize += this.vertical ?
        parentEL.children[i].computedMinWidth :
        parentEL.children[i].computedMinHeight
        ;

      prevMaxSize += this.vertical ?
        parentEL.children[i].computedMaxWidth :
        parentEL.children[i].computedMaxHeight
        ;
    }

    for ( let i = resizerIndex+1; i < parentEL.children.length; i += 2 ) {
      nextTotalSize += sizeList[i];
      nextMinSize += this.vertical ?
        parentEL.children[i].computedMinWidth :
        parentEL.children[i].computedMinHeight
        ;

      nextMaxSize += this.vertical ?
        parentEL.children[i].computedMaxWidth :
        parentEL.children[i].computedMaxHeight
        ;
    }

    return {
      sizeList: sizeList,
      resizerIndex: resizerIndex,
      prevTotalSize: prevTotalSize,
      prevMinSize: prevMinSize,
      prevMaxSize: prevMaxSize,
      nextTotalSize: nextTotalSize,
      nextMinSize: nextMinSize,
      nextMaxSize: nextMaxSize,
    };
  }

  _onMouseDown ( event ) {
    event.stopPropagation();

    //
    let parentEL = this.parentNode;

    //
    this.active = true;
    let snapshot = this._snapshot();
    let lastDir = 0;
    let rect = this.getBoundingClientRect();
    let centerx = Math.round(rect.left + rect.width/2);
    let centery = Math.round(rect.top + rect.height/2);

    for ( let i = 0; i < parentEL.children.length; ++i ) {
      let el = parentEL.children[i];
      if ( el.tagName === DockResizer.tagName ) {
        continue;
      }

      el.style.flex = `0 0 ${snapshot.sizeList[i]}px`;
    }

    // mousemove
    let mousemoveHandle = (event) => {
      event.stopPropagation();

      // get offset
      let offset;
      if ( this.vertical ) {
        offset = event.clientX - centerx;
      } else {
        offset = event.clientY - centery;
      }

      //
      if ( offset !== 0 ) {
        let rect = this.getBoundingClientRect();
        let curx = Math.round(rect.left + rect.width/2);
        let cury = Math.round(rect.top + rect.height/2);
        let delta;

        if ( this.vertical ) {
          delta = event.clientX - curx;
        } else {
          delta = event.clientY - cury;
        }

        let curDir = Math.sign(delta);

        if ( lastDir !== 0 && lastDir !== curDir ) {
          snapshot = this._snapshot();
          centerx = curx;
          centery = cury;
          offset = delta;
        }

        lastDir = curDir;

        _resize(
          parentEL.children,
          this.vertical,
          offset,
          snapshot.sizeList,
          snapshot.resizerIndex,
          snapshot.prevTotalSize,
          snapshot.prevMinSize,
          snapshot.prevMaxSize,
          snapshot.nextTotalSize,
          snapshot.nextMinSize,
          snapshot.nextMaxSize
        );
      }
    };

    // mouseup
    let mouseupHandle = (event) => {
      event.stopPropagation();

      document.removeEventListener('mousemove', mousemoveHandle);
      document.removeEventListener('mouseup', mouseupHandle);
      DomUtils.removeDragGhost();

      this.active = false;

      let parentEL = this.parentNode;

      // reflow parent
      if ( parentEL._reflowRecursively ) {
        parentEL._reflowRecursively();
      }

      // notify resize
      for ( let i = 0; i < parentEL.children.length; ++i ) {
        let el = parentEL.children[i];

        if ( el.tagName === DockResizer.tag ) {
          continue;
        }

        if ( el._notifyResize ) {
          el._notifyResize();
        }
      }

      //
      DockUtils.saveLayout();
      FocusMgr._refocus();
    };

    // add drag-ghost
    if ( Platform.isWin32 ) {
      DomUtils.addDragGhost( this.vertical ? 'ew-resize' : 'ns-resize' );
    } else {
      DomUtils.addDragGhost( this.vertical ? 'col-resize' : 'row-resize' );
    }

    document.addEventListener ( 'mousemove', mousemoveHandle );
    document.addEventListener ( 'mouseup', mouseupHandle );
  }
}

module.exports = DockResizer;

// ==========================
// Internal
// ==========================

function _resize (
  elementList, vertical, offset,
  sizeList, resizerIndex,
  prevTotalSize, prevMinSize, prevMaxSize,
  nextTotalSize, nextMinSize, nextMaxSize
) {
  unused(prevMaxSize);
  unused(nextMaxSize);

  let expectSize, newPrevSize, newNextSize;
  let prevOffset, nextOffset;
  let prevIndex, nextIndex;
  let dir = Math.sign(offset);

  if ( dir > 0 ) {
    prevIndex = resizerIndex - 1;
    nextIndex = resizerIndex + 1;
  } else {
    prevIndex = resizerIndex + 1;
    nextIndex = resizerIndex - 1;
  }

  prevOffset = offset;

  // prev
  let prevEL = elementList[prevIndex];
  let prevSize = sizeList[prevIndex];

  expectSize = prevSize + prevOffset * dir;
  if ( vertical ) {
    newPrevSize = prevEL.calcWidth(expectSize);
  } else {
    newPrevSize = prevEL.calcHeight(expectSize);
  }

  prevOffset = (newPrevSize - prevSize) * dir;

  // next
  let nextEL = elementList[nextIndex];
  let nextSize = sizeList[nextIndex];

  while (1) {
    expectSize = nextSize - prevOffset * dir;
    if ( vertical ) {
      newNextSize = nextEL.calcWidth(expectSize);
    } else {
      newNextSize = nextEL.calcHeight(expectSize);
    }

    nextOffset = (newNextSize - nextSize) * dir;

    nextEL.style.flex = `0 0 ${newNextSize}px`;

    if ( newNextSize - expectSize === 0 ) {
      break;
    }

    //
    prevOffset += nextOffset;

    //
    if ( dir > 0 ) {
      nextIndex += 2;

      if ( nextIndex >= elementList.length ) {
        break;
      }
    } else {
      nextIndex -= 2;

      if ( nextIndex < 0 ) {
        break;
      }
    }

    nextEL = elementList[nextIndex];
    nextSize = sizeList[nextIndex];
  }

  // re-calculate newPrevSize
  if ( dir > 0 ) {
    if ( nextTotalSize - offset * dir <= nextMinSize ) {
      prevOffset = (nextTotalSize - nextMinSize) * dir;
      newPrevSize = prevSize + prevOffset * dir;
    }
  } else {
    if ( prevTotalSize - offset * dir <= prevMinSize ) {
      prevOffset = (prevTotalSize - prevMinSize) * dir;
      newPrevSize = prevSize + prevOffset * dir;
    }
  }

  //
  prevEL.style.flex = `0 0 ${newPrevSize}px`;

  for ( let i = 0; i < elementList.length; ++i ) {
    let el = elementList[i];
    if ( el.tagName === DockResizer.tagName ) {
      continue;
    }

    if ( el._notifyResize ) {
      el._notifyResize();
    }
  }
}
