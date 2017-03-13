'use strict';

const ElementUtils = require('./utils');
const ResMgr = require('../utils/resource-mgr');
const DomUtils = require('../utils/dom-utils');
const Focusable = require('../behaviors/focusable');
const Disable = require('../behaviors/disable');
const Readonly = require('../behaviors/readonly');
const ButtonState = require('../behaviors/button-state');

module.exports = ElementUtils.registerElement('ui-checkbox', {
  /**
   * @property checked
   */
  get checked () {
    return this.getAttribute('checked') !== null;
  },
  set checked (val) {
    if (val) {
      this.setAttribute('checked', '');
    } else {
      this.removeAttribute('checked');
    }
  },

  /**
   * @property value
   */
  get value () {
    return this.checked;
  },
  set value (val) {
    this.checked = val;
  },

  behaviors: [ Focusable, Disable, Readonly, ButtonState ],

  template: `
    <div class="box">
      <i class="checker icon-ok"></i>
    </div>
    <span class="label">
      <content></content>
    </span>
  `,

  style: ResMgr.getResource('theme://elements/checkbox.css'),

  factoryImpl (checked, text) {
    if ( text ) {
      this.innerText = text;
    }
    this.checked = checked;
  },

  ready () {
    this._initFocusable(this);
    this._initDisable(false);
    this._initReadonly(false);
    this._initButtonState(this);
  },

  _onButtonClick () {
    this.checked = !this.checked;
    DomUtils.fire(this, 'change', {
      bubbles: false,
      detail: {
        value: this.checked,
      },
    });
    DomUtils.fire(this, 'confirm', {
      bubbles: false,
      detail: {
        value: this.checked,
      },
    });
  },
});
