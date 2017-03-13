'use strict';

const ElementUtils = require('./utils');
const Droppable = require('../behaviors/droppable');
const Focusable = require('../behaviors/focusable');

// ==========================
// exports
// ==========================

module.exports = ElementUtils.registerElement('ui-webview', {
  /**
   * @property src
   */
  get src () {
    return this.getAttribute('src');
  },
  set src (val) {
    this.setAttribute('src', val);
    this.$view.src = val;
    this.$loader.hidden = false;
  },

  behaviors: [Focusable, Droppable],

  style: `
    :host {
      display: block;
      position: relative;
      min-width: 100px;
      min-height: 100px;
    }

    .wrapper {
      background: #333;
    }

    .fit {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
    }

    [hidden] {
      display: none;
    }
  `,

  template: `
    <webview id="view"
      nodeintegration
      disablewebsecurity
      autosize="on"
    ></webview>
    <ui-loader id="loader">Loading</ui-loader>
    <div id="dropArea" class="fit" hidden></div>
  `,

  $: {
    view: '#view',
    loader: '#loader',
    dropArea: '#dropArea',
  },

  ready () {
    // init properties
    let src = this.getAttribute('src');
    if ( src === null ) {
      // src = 'about:blank'; // DISABLE
      src = 'editor-framework://static/blank.html';
    }
    this.src = src;

    //
    this._initFocusable(this);
    this._initDroppable(this.$dropArea);

    // init events
    this._initEvents();

    // TODO?
    // // init ipc
    // Electron.ipcRenderer.on('editor:dragstart', () => {
    //   this.$dropArea.removeAttribute('hidden');
    // });

    // Electron.ipcRenderer.on('editor:dragend', () => {
    //   this.$dropArea.setAttribute('hidden', '');
    // });
  },

  _initEvents () {
    this.addEventListener('drop-area-enter', event => {
      event.stopPropagation();
    });

    this.addEventListener('drop-area-leave', event => {
      event.stopPropagation();
    });

    this.addEventListener('drop-area-accept', event => {
      event.stopPropagation();
    });

    this.$view.addEventListener('console-message', () => {
    });

    this.$view.addEventListener('ipc-message', () => {
    });

    this.$view.addEventListener('did-finish-load', () => {
      this.$loader.hidden = true;
    });
  },

  reload () {
    this.$loader.hidden = false;
    this.$view.reloadIgnoringCache();
  },

  openDevTools () {
    this.$view.openDevTools();
  },
});
