'use strict';

/**
 * @module Editor.Window
 */
let Window = {};
module.exports = Window;

// requires
const Electron = require('electron');
const Ipc = require('./ipc');

let _inspecting = false;
let _maskEL;

// ==========================
// exports
// ==========================

/**
 * @method open
 * @param {string} name
 * @param {string} url
 * @param {object} options
 *
 * Open a new `Editor.Window` with `options` and load `url`.
 */
Window.open = function ( name, url, options ) {
  Ipc.sendToMain( 'editor:window-open', name, url, options );
};

/**
 * @method focus
 *
 * Focus on current window.
 */
Window.focus = function () {
  Ipc.sendToMain( 'editor:window-focus' );
};

/**
 * @method load
 * @param {string} url
 * @param {object} argv
 *
 * Load `url` in current window.
 */
Window.load = function ( url, argv ) {
  Ipc.sendToMain( 'editor:window-load', url, argv );
};

/**
 * @method resize
 * @param {number} w
 * @param {number} h
 * @param {boolean} useContentSize
 *
 * Resize current window.
 */
Window.resize = function ( w, h, useContentSize ) {
  Ipc.sendToMain( 'editor:window-resize', w, h, useContentSize );
};

/**
 * @method resizeSync
 * @param {number} w
 * @param {number} h
 * @param {boolean} useContentSize
 *
 * Resize current window synchronously.
 */
Window.resizeSync = function ( w, h, useContentSize ) {
  if ( useContentSize ) {
    Electron.remote.getCurrentWindow().setContentSize(w,h);
  } else {
    Electron.remote.getCurrentWindow().setSize(w,h);
  }
};

/**
 * @method center
 *
 * Center the window.
 */
Window.center = function () {
  Ipc.sendToMain( 'editor:window-center' );
};

// ==========================
// Internal
// ==========================

function _webviewEL ( el ) {
  if ( !el ) {
    return null;
  }

  if ( el.tagName === 'WEBVIEW' ) {
    return el;
  }

  // in shadow
  if ( el.parentNode && el.parentNode.host ) {
    if ( el.parentNode.host.tagName === 'WEBVIEW' ) {
      return el.parentNode.host;
    }
  }

  return null;
}

function _elementFromPoint ( x, y ) {
  let el = document.elementFromPoint(x,y);
  while ( el && el.shadowRoot ) {
    let nextEL = el.shadowRoot.elementFromPoint(x,y);
    if ( !nextEL ) {
      return el;
    }

    el = nextEL;
  }

  return el;
}

function _mousemove ( event ) {
  event.preventDefault();
  event.stopPropagation();

  _maskEL.remove();

  let el = _elementFromPoint( event.clientX, event.clientY );
  let rect = el.getBoundingClientRect();

  // if we are in web-view, show red color
  if ( _webviewEL(el) ) {
    _maskEL.style.backgroundColor = 'rgba( 128, 0, 0, 0.4)';
    _maskEL.style.outline = '1px solid #f00';
  } else {
    _maskEL.style.backgroundColor = 'rgba( 0, 128, 255, 0.5)';
    _maskEL.style.outline = '1px solid #09f';
  }

  //
  document.body.appendChild(_maskEL);
  _maskEL.style.top = `${rect.top+1}px`;
  _maskEL.style.left = `${rect.left+1}px`;
  _maskEL.style.width = `${rect.width-2}px`;
  _maskEL.style.height = `${rect.height-2}px`;

  _maskEL.children[0].innerText =
    `<${el.tagName.toLowerCase()} class="${el.className}" />`;
}

function _mousedown ( event ) {
  event.preventDefault();
  event.stopPropagation();

  _inspectOFF ();

  let el = document.elementFromPoint( event.clientX, event.clientY );
  let webviewEL = _webviewEL(el);
  if ( webviewEL ) {
    webviewEL.openDevTools();
    if ( webviewEL.devToolsWebContents ) {
      webviewEL.devToolsWebContents.focus();
    }
    return;
  }

  // NOTE: we use ipcRenderer directly here to make it runnable in Test Runner
  Electron.ipcRenderer.send( 'editor:window-inspect-at', event.clientX, event.clientY );
}

function _keydown ( event ) {
  event.preventDefault();
  event.stopPropagation();

  if ( event.which === 27 ) {
    _inspectOFF ();
  }
}

function _inspectOFF () {
  _inspecting = false;
  _maskEL.remove();
  _maskEL = null;

  window.removeEventListener('mousemove', _mousemove, true);
  window.removeEventListener('mousedown', _mousedown, true);
  window.removeEventListener('keydown', _keydown, true);
}

function _inspectON () {
  if ( _inspecting ) {
    return;
  }
  _inspecting = true;

  //
  if ( !_maskEL ) {
    _maskEL = document.createElement('div');
    _maskEL.style.position = 'fixed';
    _maskEL.style.zIndex = '999';
    _maskEL.style.top = '0';
    _maskEL.style.right = '0';
    _maskEL.style.bottom = '0';
    _maskEL.style.left = '0';
    _maskEL.style.backgroundColor = 'rgba( 0, 128, 255, 0.5)';
    _maskEL.style.outline = '1px solid #09f';
    _maskEL.style.cursor = 'default';

    let label = document.createElement('div');
    label.style.display = 'inline-block';
    label.style.position = 'relative';
    label.style.top = '-18px';
    label.style.left = '0px';
    label.style.padding = '0px 5px';
    label.style.fontSize = '12px';
    label.style.fontWeight = 'bold';
    label.style.whiteSpace = 'nowrap';
    label.style.color = '#333';
    label.style.backgroundColor = '#f90';
    label.innerText = '';
    _maskEL.appendChild(label);
    document.body.appendChild(_maskEL);
  }

  window.addEventListener('mousemove', _mousemove, true);
  window.addEventListener('mousedown', _mousedown, true);
  window.addEventListener('keydown', _keydown, true);
}

// ==========================
// Ipc events
// ==========================

const ipcRenderer = Electron.ipcRenderer;

ipcRenderer.on('editor:window-inspect', function () {
  _inspectON ();
});
