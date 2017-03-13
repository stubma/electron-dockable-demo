'use strict';

const ElementUtils = require('./utils');
const ResMgr = require('../utils/resource-mgr');
const Focusable = require('../behaviors/focusable');
const Disable = require('../behaviors/disable');

module.exports = ElementUtils.registerElement('ui-box-container', {
  behaviors: [ Focusable, Disable ],

  style: ResMgr.getResource('theme://elements/box-container.css'),

  template: `
    <content></content>
  `,

  ready () {
    this._initFocusable(this);
    this._initDisable(true);
  },
});
