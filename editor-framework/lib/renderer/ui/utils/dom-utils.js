'use strict';

let DomUtils = {};
module.exports = DomUtils;

// requires
const _ = require('lodash');
const Console = require('../../console');
const ResMgr = require('./resource-mgr');

let _cancelDrag = null;
let _dragGhost = null;

let _hitGhost = null;
let _hitGhostMousedownHandle = null;

let _loadingMask = null;
let _loadingMaskMousedownHandle = null;

let _mouseEvents = ['mousedown', 'mousemove', 'mouseup', 'click'];
// an array of bitmask values for mapping MouseEvent.which to MouseEvent.buttons
let _which2buttons = [0, 1, 4, 2];
let _mouseHasButtons = (function() {
  try {
    return new MouseEvent('test', {buttons: 1}).buttons === 1;
  } catch (e) {
    return false;
  }
})();

function _hasLeftMouseButton(e) {
  var type = e.type;
  // exit early if the event is not a mouse event
  if (_mouseEvents.indexOf(type) === -1) {
    return false;
  }
  // e.button is not reliable for mousemove (0 is overloaded as both left button and no buttons)
  // instead we use e.buttons (bitmask of buttons) or fall back to e.which (deprecated, 0 for no buttons, 1 for left button)
  if (type === 'mousemove') {
    // allow undefined for testing events
    var buttons = e.buttons === undefined ? 1 : e.buttons;
    if ((e instanceof window.MouseEvent) && !_mouseHasButtons) {
      buttons = _which2buttons[e.which] || 0;
    }
    // buttons is a bitmask, check that the left button bit is set (1)
    return Boolean(buttons & 1);
  } else {
    // allow undefined for testing events
    var button = e.button === undefined ? 0 : e.button;
    // e.button is 0 in mousedown/mouseup/click for left button activation
    return button === 0;
  }
}

// ==========================
// exports
// ==========================

/**
 * @method createStyleElement
 * @param {string} url
 *
 * Load `url` content and create a style element to wrap it.
 */
DomUtils.createStyleElement = function ( url ) {
  let content = ResMgr.getResource(url) || '';
  if ( !content ) {
    Console.error(`${url} not preloaded`);
    return null;
  }

  let styleElement = document.createElement('style');
  styleElement.type = 'text/css';
  styleElement.textContent = content;

  return styleElement;
};

/**
 * @method clear
 * @param {HTMLElement} element
 *
 * Remove all child element.
 */
DomUtils.clear = function (element) {
  while ( element.firstChild ) {
    element.removeChild(element.firstChild);
  }
};

/**
 * @method index
 * @param {HTMLElement} element
 *
 * Get the index of the `element`
 */
DomUtils.index = function ( element ) {
  let parentEL = element.parentNode;

  for ( let i = 0, len = parentEL.children.length; i < len; ++i ) {
    if ( parentEL.children[i] === element ) {
      return i;
    }
  }

  return -1;
};

/**
 * @method parentElement
 * @param {HTMLElement} element
 *
 * Get the parent element, it will go through the host if it is a shadow element
 */
DomUtils.parentElement = function ( element ) {
  let parent = element.parentElement;
  if ( !parent ) {
    parent = element.parentNode;
    if ( parent && parent.host ) {
      return parent.host;
    }
  }
};

/**
 * @method offsetTo
 * @param {HTMLElement} el
 * @param {HTMLElement} parentEL
 *
 * Returns the offset `{x, y}` from `el` to `parentEL`
 */
DomUtils.offsetTo = function ( el, parentEL ) {
  let xPosition = 0;
  let yPosition = 0;

  while ( el && el !== parentEL ) {
    xPosition += (el.offsetLeft - el.scrollLeft);
    yPosition += (el.offsetTop - el.scrollTop);
    el = el.offsetParent;
  }

  if ( parentEL && el !== parentEL ) {
    Console.warn('The parentEL is not the element\'s offsetParent');
    return { x: 0, y: 0 };
  }

  return { x: xPosition, y: yPosition };
};

/**
 * @method walk
 * @param {HTMLElement} el
 * @param {Object} opts
 * @param {Boolean} opts.diveToShadow
 * @param {Boolean} opts.excludeSelf
 * @param {Function} cb
 *
 * Recursively search children use depth first algorithm.
 */
DomUtils.walk = function ( el, optsOrFn, cb ) {
  let opts = optsOrFn;

  if ( typeof optsOrFn === 'function' ) {
    cb = optsOrFn;
    opts = {};
  }

  // execute self if not exclude
  if ( !opts.excludeSelf ) {
    let skipChildren = cb ( el );
    if ( skipChildren ) {
      return;
    }
  }

  // TODO opts.diveToShadow

  //
  if ( !el.children.length ) {
    return;
  }

  let parentEL = el;
  let curEL = el.children[0];

  while (1) {
    if ( !curEL ) {
      curEL = parentEL;
      if ( curEL === el ) {
        return;
      }

      parentEL = parentEL.parentElement;
      curEL = curEL.nextElementSibling;
    }

    if ( curEL ) {
      let skipChildren = cb ( curEL );
      if ( skipChildren ) {
        curEL = curEL.nextElementSibling;
        continue;
      }

      if ( curEL.children.length ) {
        parentEL = curEL;
        curEL = curEL.children[0];
      } else {
        curEL = curEL.nextElementSibling;
      }
    }
  }
};

// NOTE: fire means it can be propagate, emit don't have that meaning
// NOTE: CustomEvent.bubbles default is false
/**
 * @method fire
 * @param {HTMLElement} element
 * @param {String} eventName
 * @param {Object} opts
 *
 * Fires a CustomEvent to the specific element.
 *
 * @example
 * ```js
 * Editor.fire(el, 'foobar', {
 *   bubbles: false,
 *   detail: {
 *     value: 'Hello World!'
 *   }
 * });
 * ```
 */
DomUtils.fire = function ( element, eventName, opts ) {
  opts = opts || {};
  element.dispatchEvent(new window.CustomEvent(eventName,opts));
};

/**
 * @method acceptEvent
 * @param {Event} event
 *
 * Call preventDefault and stopImmediatePropagation for the event
 */
DomUtils.acceptEvent = function (event) {
  event.preventDefault();
  event.stopImmediatePropagation();
};

/**
 * @method installDownUpEvent
 * @param {HTMLElement} element
 *
 * Handle mouse down and up event for button like element
 */
DomUtils.installDownUpEvent = function (element) {
  function _trackDocument(movefn, upfn) {
    document.addEventListener('mousemove', movefn);
    document.addEventListener('mouseup', upfn);
  }

  function _untrackDocument(movefn, upfn) {
    document.removeEventListener('mousemove', movefn);
    document.removeEventListener('mouseup', upfn);
  }

  element.addEventListener('mousedown', function (event) {
    DomUtils.acceptEvent(event);

    if ( !_hasLeftMouseButton(event) ) {
      return;
    }

    let movefn = function movefn(e) {
      if ( _hasLeftMouseButton(e) ) {
        return;
      }

      DomUtils.fire(element, 'up', {
        sourceEvent: e,
        bubbles: true
      });
      _untrackDocument(movefn, upfn);
    };

    let upfn = function upfn(e) {
      if ( !_hasLeftMouseButton(e) ) {
        return;
      }

      DomUtils.fire(element, 'up', {
        sourceEvent: e,
        bubbles: true
      });
      _untrackDocument(movefn, upfn);
    };

    _trackDocument(movefn, upfn);
    DomUtils.fire(element, 'down', {
      sourceEvent: event,
      bubbles: true
    });
  });
};

/**
 * @method inDocument
 * @param {HTMLElement} el
 *
 * Check if the element is in document
 */
DomUtils.inDocument = function ( el ) {
  while (1) {
    if (!el) {
      return false;
    }

    if (el === document) {
      return true;
    }

    // get parent or shadow host
    el = el.parentNode;
    if (el && el.host) {
      el = el.host;
    }
  }
};

/**
 * @method inPanel
 * @param {HTMLElement} el
 *
 * Check if the element is in panel
 */
DomUtils.inPanel = function ( el ) {
  while (1) {
    if (!el) {
      return null;
    }

    if (el.tagName === 'UI-PANEL-FRAME') {
      return el;
    }

    // HACK: A fallback solution for polymer-ui
    if (el.tagName === 'UI-DOCK-PANEL') {
      return el;
    }

    // get parent or shadow host
    el = el.parentNode;
    if (el && el.host) {
      el = el.host;
    }
  }
};

/**
 * @method isVisible
 * @param {HTMLElement} el
 *
 * Check if the element is visible by itself
 */
DomUtils.isVisible = function ( el ) {
  let computed = window.getComputedStyle(el);
  if (
    computed.display === 'none' ||
    computed.visibility === 'hidden' ||
    computed.opacity === 0
  ) {
    return false;
  }

  return true;
};

/**
 * @method isVisibleInHierarchy
 * @param {HTMLElement} el
 *
 * Check if the element is visible in hierarchy
 */
DomUtils.isVisibleInHierarchy = function ( el ) {
  if ( DomUtils.inDocument(el) === false ) {
    return false;
  }

  while (1) {
    if (el === document) {
      return true;
    }

    if ( DomUtils.isVisible(el) === false ) {
      return false;
    }

    // get parent or shadow host
    el = el.parentNode;
    if (el && el.host) {
      el = el.host;
    }
  }
};

/**
 * @method startDrag
 * @param {String} cursor - CSS cursor
 * @param {Event} event
 * @param {Function} onMove
 * @param {Function} onEnd
 *
 * Start handling element dragging behavior
 */
DomUtils.startDrag = function ( cursor, event, onMove, onEnd ) {
  DomUtils.addDragGhost(cursor);

  event.stopPropagation();

  let pressx = event.clientX, lastx = event.clientX;
  let pressy = event.clientY, lasty = event.clientY;
  let dx = 0, offsetx = 0;
  let dy = 0, offsety = 0;

  let mousemoveHandle = function (event) {
    event.stopPropagation();

    dx = event.clientX - lastx;
    dy = event.clientY - lasty;
    offsetx = event.clientX - pressx;
    offsety = event.clientY - pressy;

    lastx = event.clientX;
    lasty = event.clientY;

    if ( onMove ) {
      onMove( event, dx, dy, offsetx, offsety );
    }
  };

  let mouseupHandle = function (event) {
    event.stopPropagation();

    document.removeEventListener('mousemove', mousemoveHandle);
    document.removeEventListener('mouseup', mouseupHandle);

    DomUtils.removeDragGhost();

    dx = event.clientX - lastx;
    dy = event.clientY - lasty;
    offsetx = event.clientX - pressx;
    offsety = event.clientY - pressy;

    _cancelDrag = null;
    if ( onEnd ) {
      onEnd( event, dx, dy, offsetx, offsety);
    }
  };

  _cancelDrag = function () {
    document.removeEventListener('mousemove', mousemoveHandle);
    document.removeEventListener('mouseup', mouseupHandle);

    DomUtils.removeDragGhost();
  };

  document.addEventListener ( 'mousemove', mousemoveHandle );
  document.addEventListener ( 'mouseup', mouseupHandle );
};

/**
 * @method cancelDrag
 *
 * Cancel dragging element
 */
DomUtils.cancelDrag = function () {
  if ( _cancelDrag ) {
    _cancelDrag();
  }
};

/**
 * @method addDragGhost
 * @param {String} cursor - CSS cursor
 *
 * Add a dragging mask to keep the cursor not changed while dragging
 */
DomUtils.addDragGhost = function ( cursor ) {
  // add drag-ghost
  if ( _dragGhost === null ) {
    _dragGhost = document.createElement('div');
    _dragGhost.classList.add('drag-ghost');
    _dragGhost.style.position = 'absolute';
    _dragGhost.style.zIndex = '999';
    _dragGhost.style.top = '0';
    _dragGhost.style.right = '0';
    _dragGhost.style.bottom = '0';
    _dragGhost.style.left = '0';
    _dragGhost.oncontextmenu = function () { return false; };
  }
  _dragGhost.style.cursor = cursor;
  document.body.appendChild(_dragGhost);

  return _dragGhost;
};

/**
 * @method removeDragGhost
 *
 * Remove the dragging mask
 */
DomUtils.removeDragGhost = function () {
  if ( _dragGhost !== null ) {
    _dragGhost.style.cursor = 'auto';

    if ( _dragGhost.parentElement !== null ) {
      _dragGhost.parentElement.removeChild(_dragGhost);
    }
  }
};

/**
 * @method addHitGhost
 * @param {String} cursor - CSS cursor
 * @param {Number} zindex
 * @param {Function} onhit
 *
 * Add hit mask
 */
DomUtils.addHitGhost = function ( cursor, zindex, onhit ) {
  // add drag-ghost
  if ( _hitGhost === null ) {
    _hitGhost = document.createElement('div');
    _hitGhost.classList.add('hit-ghost');
    _hitGhost.style.position = 'absolute';
    _hitGhost.style.zIndex = zindex;
    _hitGhost.style.top = '0';
    _hitGhost.style.right = '0';
    _hitGhost.style.bottom = '0';
    _hitGhost.style.left = '0';
    // _hitGhost.style.background = 'rgba(0,0,0,0.2)';
    _hitGhost.oncontextmenu = function () { return false; };
  }

  _hitGhost.style.cursor = cursor;
  _hitGhostMousedownHandle = function (event) {
    event.preventDefault();
    event.stopPropagation();

    if ( onhit ) {
      onhit();
    }
  };
  _hitGhost.addEventListener('mousedown', _hitGhostMousedownHandle);
  document.body.appendChild(_hitGhost);

  return _hitGhost;
};

/**
 * @method removeHitGhost
 *
 * Remove hit mask
 */
DomUtils.removeHitGhost = function () {
  if ( _hitGhost !== null ) {
    _hitGhost.style.cursor = 'auto';

    if ( _hitGhost.parentElement !== null ) {
      _hitGhost.parentElement.removeChild(_hitGhost);
      _hitGhost.removeEventListener('mousedown', _hitGhostMousedownHandle);
      _hitGhostMousedownHandle = null;
    }
  }
};

/**
 * @method addLoadingMask
 * @param {Object} options
 * @param {Function} onclick
 *
 * Add loading mask
 */
DomUtils.addLoadingMask = function ( options, onclick ) {
  // add drag-ghost
  if ( _loadingMask === null ) {
    _loadingMask = document.createElement('div');
    _loadingMask.classList.add('loading-mask');
    _loadingMask.style.position = 'absolute';
    _loadingMask.style.top = '0';
    _loadingMask.style.right = '0';
    _loadingMask.style.bottom = '0';
    _loadingMask.style.left = '0';
    _loadingMask.oncontextmenu = function () { return false; };
  }

  if ( options && typeof options.zindex === 'string' ) {
    _loadingMask.style.zIndex = options.zindex;
  } else {
    _loadingMask.style.zIndex = '1999';
  }

  if ( options && typeof options.background === 'string' ) {
    _loadingMask.style.backgroundColor = options.background;
  } else {
    _loadingMask.style.backgroundColor = 'rgba(0,0,0,0.2)';
  }

  if ( options && typeof options.cursor === 'string' ) {
    _loadingMask.style.cursor = options.cursor;
  } else {
    _loadingMask.style.cursor = 'default';
  }

  let _loadingMaskMousedownHandle = function (event) {
    event.preventDefault();
    event.stopPropagation();

    if ( onclick ) {
      onclick();
    }
  };
  _loadingMask.addEventListener('mousedown', _loadingMaskMousedownHandle);

  document.body.appendChild(_loadingMask);

  return _loadingMask;
};

/**
 * @method removeLoadingMask
 *
 * Remove loading mask
 */
DomUtils.removeLoadingMask = function () {
  if ( _loadingMask !== null ) {
    _loadingMask.style.cursor = 'auto';

    if ( _loadingMask.parentElement !== null ) {
      _loadingMask.parentElement.removeChild(_loadingMask);
      _loadingMask.removeEventListener('mousedown', _loadingMaskMousedownHandle);
      _loadingMaskMousedownHandle = null;
    }
  }
};

/**
 * @method toHumanText
 * @param {String} text
 *
 * Convert a string to human friendly text. For example, `fooBar` will be `Foo bar`
 */
DomUtils.toHumanText = function ( text ) {
  let result = text.replace(/[-_]([a-z])/g, function(m) {
    return m[1].toUpperCase();
  });

  result = result.replace(/([a-z][A-Z])/g, function (g) {
    return g[0] + ' ' + g[1];
  });

  // remove first white-space
  if ( result.charAt(0) === ' ' ) {
    result.slice(1);
  }

  // capitalize the first letter
  return result.charAt(0).toUpperCase() + result.slice(1);
};

/**
 * @method camelCase
 * @param {String} text
 *
 * Convert a string to camel case text. For example, `foo-bar` will be `fooBar`
 */
DomUtils.camelCase = function (text) {
  return _.camelCase(text);
};

/**
 * @method kebabCase
 * @param {String} text
 *
 * Convert a string to kebab case text. For example, `fooBar` will be `foo-bar`
 */
DomUtils.kebabCase = function (text) {
  return _.kebabCase(text);
};

// DELME
DomUtils._focusParent = function ( element ) {
  // NOTE: DO NOT use Polymer.dom(element).parentNode
  let parent = element.parentElement;
  while ( parent ) {
    if (
      parent.tabIndex !== null &&
      parent.tabIndex !== undefined &&
      parent.tabIndex !== -1
    ) {
      parent.focus();
      return;
    }

    parent = parent.parentElement;
  }
};

// DELME
DomUtils._getFirstFocusableChild = function ( element ) {
  if (
    element.tabIndex !== null &&
    element.tabIndex !== undefined &&
    element.tabIndex !== -1
  ) {
    return element;
  }

  for ( let i = 0; i < element.children.length; ++i ) {
    let childEL = DomUtils._getFirstFocusableChild(element.children[i]);

    if ( childEL !== null ) {
      return childEL;
    }
  }

  return null;
};
