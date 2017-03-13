'use strict';

const Chroma = require('chroma-js');
const ElementUtils = require('./utils');
const ResMgr = require('../utils/resource-mgr');

module.exports = ElementUtils.registerElement('ui-loader', {
  /**
   * @property inline
   */
  get inline () {
    return this.getAttribute('inline') !== null;
  },
  set inline (val) {
    if (val) {
      this.setAttribute('inline', '');
    } else {
      this.removeAttribute('inline');
    }
  },

  /**
   * @property maskColor
   */
  get maskColor () {
    return this._maskColor;
  },
  set maskColor (val) {
    let rgba = Chroma(val).rgba();
    if ( rgba !== this._maskColor ) {
      this._maskColor = rgba;
      this.style.backgroundColor = Chroma(rgba).css();
    }
  },

  template: `
    <div class="animate"></div>
    <div class="label">
      <content></content>
    </div>
  `,

  style: ResMgr.getResource('theme://elements/loader.css'),

  factoryImpl (text) {
    if ( text ) {
      this.innerText = text;
    }
  },

  ready () {
    // init _maskColor
    let color = this.getAttribute('color');
    if ( color !== null ) {
      this._maskColor = Chroma(color).rgba();
    } else {
      this._maskColor = [0,0,0,0.3];
    }
    this.style.backgroundColor = Chroma(this.maskColor).css();
  },
});
