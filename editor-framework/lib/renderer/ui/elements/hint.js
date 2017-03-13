'use strict';

const ElementUtils = require('./utils');
const ResMgr = require('../utils/resource-mgr');

module.exports = ElementUtils.registerElement('ui-hint', {
  /**
   * @property position
   */
  get position () {
    return this._position;
  },
  set position (val) {
    if (this._position !== val) {
      this._position = val;

      if (
        this.classList.contains('top') ||
        this.classList.contains('bottom')
      ) {
        if ( this._position[0] === '-' ) {
          this.$arrow.style.right = this._position.substr(1);
        } else {
          this.$arrow.style.left = this._position;
        }
      } else if (
        this.classList.contains('left') ||
        this.classList.contains('right')
      ) {
        if ( this._position[0] === '-' ) {
          this.$arrow.style.bottom = this._position.substr(1);
        } else {
          this.$arrow.style.top = this._position;
        }
      }
    }
  },

  template: `
    <div class="box">
      <content></content>
      <div class="arrow"></div>
    </div>
  `,

  $: {
    arrow: '.arrow'
  },

  style: ResMgr.getResource('theme://elements/hint.css'),

  factoryImpl (text) {
    if ( text ) {
      this.innerText = text;
    }
  },

  ready () {
    let pos = this.getAttribute('position');
    if ( pos === null ) {
      pos = '50%';
    }
    this.position = pos;
  },
});
