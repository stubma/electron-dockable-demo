'use strict';

const DomUtils = require('../utils/dom-utils');

// ==========================
// exports
// ==========================

let Resizable = {
  _resizable: true,

  // width
  get width () {
    let val = this.getAttribute('width');
    if ( val !== null && val !== 'auto' ) {
      val = parseInt(val);
    }
    return val;
  },
  set width (val) { this.setAttribute('width', val); },

  // min-width
  get minWidth () {
    let val = this.getAttribute('min-width');
    if ( val !== null && val !== 'auto' ) {
      val = parseInt(val);
    }
    return val;
  },
  set minWidth (val) { this.setAttribute('min-width', val); },

  // max-width
  get maxWidth () {
    let val = this.getAttribute('max-width');
    if ( val !== null && val !== 'auto' ) {
      val = parseInt(val);
    }
    return val;
  },
  set maxWidth (val) { this.setAttribute('max-width', val); },

  // height
  get height () {
    let val = this.getAttribute('height');
    if ( val !== null && val !== 'auto' ) {
      val = parseInt(val);
    }
    return val;
  },
  set height (val) { this.setAttribute('height', val); },

  // min-height
  get minHeight () {
    let val = this.getAttribute('min-height');
    if ( val !== null && val !== 'auto' ) {
      val = parseInt(val);
    }
    return val;
  },
  set minHeight (val) { this.setAttribute('min-height', val); },

  // max-height
  get maxHeight () {
    let val = this.getAttribute('max-height');
    if ( val !== null && val !== 'auto' ) {
      val = parseInt(val);
    }
    return val;
  },
  set maxHeight (val) { this.setAttribute('max-height', val); },

  _initResizable () {
    ['width', 'height'].forEach(prop => {
      if ( this[prop] === null ) {
        this[prop] = 200;
        return;
      }
    });

    ['minWidth', 'minHeight', 'maxWidth', 'maxHeight'].forEach(prop => {
      if ( this[prop] === null ) {
        this[prop] = 'auto';
        return;
      }
    });

    this._initSize();
  },

  // dispatch 'resize' event recursively
  _notifyResize () {
    DomUtils.fire(this, 'resize');

    for ( let i = 0; i < this.children.length; ++i ) {
      let childEL = this.children[i];
      if ( childEL._resizable ) {
        childEL._notifyResize();
      }
    }
  },

  // init size from its own attributes
  _initSize () {
    let minWidth = this.minWidth;
    let maxWidth = this.maxWidth;

    if ( maxWidth !== 'auto' && minWidth !== 'auto' && maxWidth < minWidth ) {
      this.maxWidth = maxWidth = minWidth;
    }

    let minHeight = this.minHeight;
    let maxHeight = this.maxHeight;

    if ( maxHeight !== 'auto' && minHeight !== 'auto' && maxHeight < minHeight ) {
      this.maxHeight = maxHeight = minHeight;
    }

    // width
    this.curWidth = this.computedWidth = this.width;

    // height
    this.curHeight = this.computedHeight = this.height;

    // min-width
    this.computedMinWidth = minWidth;
    if ( this.computedMinWidth !== 'auto' ) {
      this.style.minWidth = `${this.computedMinWidth}px`;
    } else {
      this.style.minWidth = 'auto';
    }

    // max-width
    this.computedMaxWidth = maxWidth;
    if ( this.computedMaxWidth !== 'auto' ) {
      this.style.maxWidth = `${this.computedMaxWidth}px`;
    } else {
      this.style.maxWidth = 'auto';
    }

    // min-height
    this.computedMinHeight = minHeight;
    if ( this.computedMinHeight !== 'auto' ) {
      this.style.minHeight = `${this.computedMinHeight}px`;
    } else {
      this.style.minHeight = 'auto';
    }

    // max-height
    this.computedMaxHeight = maxHeight;
    if ( this.computedMaxHeight !== 'auto' ) {
      this.style.maxHeight = `${this.computedMaxHeight}px`;
    } else {
      this.style.maxHeight = 'auto';
    }
  },

  //
  calcWidth ( width ) {
    if ( this.computedMinWidth !== 'auto' && width < this.computedMinWidth ) {
      return this.computedMinWidth;
    }

    if ( this.computedMaxWidth !== 'auto' && width > this.computedMaxWidth ) {
      return this.computedMaxWidth;
    }

    return width;
  },

  //
  calcHeight ( height ) {
    if ( this.computedMinHeight !== 'auto' && height < this.computedMinHeight ) {
      return this.computedMinHeight;
    }

    if ( this.computedMaxHeight !== 'auto' && height > this.computedMaxHeight ) {
      return this.computedMaxHeight;
    }

    return height;
  },

  // init and finalize min,max depends on children
  finalizeSize ( elements, reset ) {
    let autoWidth = false;
    let autoHeight = false;

    // reset width, height
    this.computedWidth = this.width;
    this.computedHeight = this.height;

    for ( let i = 0; i < elements.length; ++i ) {
      let el = elements[i];

      // width
      if ( autoWidth || el.computedWidth === 'auto' ) {
        autoWidth = true;
        this.computedWidth = 'auto';
      } else {
        if ( this.width === 'auto' || el.computedWidth > this.computedWidth ) {
          this.computedWidth = el.computedWidth;
        }
      }

      // height
      if ( autoHeight || el.computedHeight === 'auto' ) {
        autoHeight = true;
        this.computedHeight = 'auto';
      } else {
        if ( this.height === 'auto' || el.computedHeight > this.computedHeight ) {
          this.computedHeight = el.computedHeight;
        }
      }
    }

    if ( reset ) {
      this.curWidth = this.computedWidth;
      this.curHeight = this.computedHeight;
    }
    // if reset is false, we just reset the part that
    else {
      if ( this.parentNode.row ) {
        this.curHeight = this.computedHeight;
      } else {
        this.curWidth = this.computedWidth;
      }
    }
  },

  // init and finalize min,max depends on children
  finalizeMinMax ( elements, row ) {
    let infWidth = false;
    let infHeight = false;

    this.computedMinWidth = elements.length > 0 ? 3 * (elements.length-1) : 0; // preserve resizers' width
    this.computedMinHeight = elements.length > 0 ? 3 * (elements.length-1) : 0; // preserve resizers' height
    this.computedMaxWidth = this.maxWidth;
    this.computedMaxHeight = this.maxHeight;

    // collect child elements' size

    if ( row ) {
      for ( let i = 0; i < elements.length; ++i ) {
        let el = elements[i];

        // min-width
        if ( el.computedMinWidth !== 'auto' ) {
          this.computedMinWidth += el.computedMinWidth;
        }

        // min-height
        if (
          el.computedMinHeight !== 'auto' &&
          this.computedMinHeight < el.computedMinHeight
        ) {
          this.computedMinHeight = el.computedMinHeight;
        }

        // max-width
        if ( infWidth || el.computedMaxWidth === 'auto' ) {
          infWidth = true;
          this.computedMaxWidth = 'auto';
        } else {
          this.computedMaxWidth += el.computedMaxWidth;
        }

        // max-height
        if ( infHeight || el.computedMaxHeight === 'auto' ) {
          infHeight = true;
          this.computedMaxHeight = 'auto';
        } else {
          if ( this.computedMaxHeight < el.computedMaxHeight ) {
            this.computedMaxHeight = el.computedMaxHeight;
          }
        }
      }
    } else {
      for ( let i = 0; i < elements.length; ++i ) {
        let el = elements[i];

        // min-width
        if (
          el.computedMinWidth !== 'auto' &&
          this.computedMinWidth < el.computedMinWidth
        ) {
          this.computedMinWidth = el.computedMinWidth;
        }

        // min-height
        if ( el.computedMinHeight !== 'auto' ) {
          this.computedMinHeight += el.computedMinHeight;
        }

        // max-width
        if ( infWidth || el.computedMaxWidth === 'auto' ) {
          infWidth = true;
          this.computedMaxWidth = 'auto';
        } else {
          if ( this.computedMaxWidth < el.computedMaxWidth ) {
            this.computedMaxWidth = el.computedMaxWidth;
          }
        }

        // max-height
        if ( infHeight || el.computedMaxHeight === 'auto' ) {
          infHeight = true;
          this.computedMaxHeight = 'auto';
        } else {
          this.computedMaxHeight += el.computedMaxHeight;
        }
      }
    }

    if (
      this.minWidth !== 'auto' &&
      this.computedMinWidth !== 'auto' &&
        this.minWidth > this.computedMinWidth
    ) {
      this.computedMinWidth = this.minWidth;
    }

    if (
      this.minHeight !== 'auto' &&
      this.computedMinHeight !== 'auto' &&
        this.minHeight > this.computedMinHeight
    ) {
      this.computedMinHeight = this.minHeight;
    }

    // final decision

    // min-width
    if ( this.computedMinWidth !== 'auto' ) {
      this.style.minWidth = this.computedMinWidth + 'px';
    } else {
      this.style.minWidth = 'auto';
    }

    // max-width
    if ( this.computedMaxWidth !== 'auto' ) {
      this.style.maxWidth = this.computedMaxWidth + 'px';
    } else {
      this.style.maxWidth = 'auto';
    }

    // min-height
    if ( this.computedMinHeight !== 'auto' ) {
      this.style.minHeight = this.computedMinHeight + 'px';
    } else {
      this.style.minHeight = 'auto';
    }

    // max-height
    if ( this.computedMaxHeight !== 'auto' ) {
      this.style.maxHeight = this.computedMaxHeight + 'px';
    } else {
      this.style.maxHeight = 'auto';
    }
  },
};

module.exports = Resizable;
