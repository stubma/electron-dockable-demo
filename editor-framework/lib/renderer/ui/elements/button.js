'use strict';

const ElementUtils = require('./utils');
const ResMgr = require('../utils/resource-mgr');
const DomUtils = require('../utils/dom-utils');
const Focusable = require('../behaviors/focusable');
const Disable = require('../behaviors/disable');
const ButtonState = require('../behaviors/button-state');

module.exports = ElementUtils.registerElement('ui-button', {
  behaviors: [ Focusable, Disable, ButtonState ],

  template: `
    <div class="inner">
      <content></content>
    </div>
  `,

  style: ResMgr.getResource('theme://elements/button.css'),

  factoryImpl (text) {
    if ( text ) {
      this.innerText = text;
    }
  },

  ready () {
    this._initFocusable(this);
    this._initDisable(false);
    this._initButtonState(this);
  },

  _onButtonClick () {
    // make sure click event first
    setTimeout(() => {
      DomUtils.fire(this, 'confirm', { bubbles: false });
    }, 1);
  },
});
