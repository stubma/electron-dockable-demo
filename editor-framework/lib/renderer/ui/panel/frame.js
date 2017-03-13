'use strict';

// ==========================
// exports
// ==========================

class PanelFrame extends window.HTMLElement {
  static get tagName () { return 'UI-PANEL-FRAME'; }

  /**
   * @property root
   */
  get root () {
    if ( this.shadowRoot ) {
      return this.shadowRoot;
    }
    return this;
  }

  createdCallback () {
    // this.createShadowRoot(); // NOTE: move this to panel-loader.js
    this.classList.add('fit');
    this.tabIndex = -1;

    // for focus-mgr
    this._focusedElement = null;
    this._lastFocusedElement = null;
  }

  queryID ( id ) {
    return this.root.getElementById(id);
  }

  query ( selector ) {
    return this.root.querySelector(selector);
  }

  queryAll ( selector ) {
    return this.root.querySelectorAll(selector);
  }
}

module.exports = PanelFrame;
