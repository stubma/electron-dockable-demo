'use strict';

const ElementUtils = require('./utils');
const MathUtils = require('../../../share/math');
const ResMgr = require('../utils/resource-mgr');

module.exports = ElementUtils.registerElement('ui-progress', {
  // range: 0-100
  get value () { return this._value; },
  set value ( val ) {
    if ( val === null || val === undefined ) {
      val = 0;
    }

    val = parseInt(MathUtils.clamp( val, 0, 100 ));

    if ( this._value !== val ) {
      this._value = val;
      this._updateProgressBar();
    }
  },

  template: `
    <div class="bar">
      <div class="label"></div>
    </div>
  `,

  style: ResMgr.getResource('theme://elements/progress.css'),

  $: {
    bar: '.bar',
    label: '.label',
  },

  factoryImpl (progress) {
    if ( progress ) {
      this.value = progress;
    }
  },

  ready () {
    this.$bar.addEventListener('transitionend', () => {
      this._inTransition = false;
      this.$label.innerText = `${this._value}%`;
    });

    this._inTransition = false;

    let val = parseFloat(this.getAttribute('value'));
    this._value = isNaN(val) ? 0 : val;

    this.$bar.style.width = `${this._value}%`;
    this.$label.innerText = `${this._value}%`;
  },

  _updateProgressBar () {
    this._inTransition = true;
    this.$bar.style.width = `${this._value}%`;
    this._updateLabel();
  },

  _updateLabel () {
    window.requestAnimationFrame(() => {
      if ( !this._inTransition ) {
        return;
      }

      let thisWidth = this.clientWidth - 4; // padding-left + padding-right = 4px
      let barWidth = this.$bar.clientWidth;
      let percentage = parseInt(barWidth/thisWidth * 100);

      if ( barWidth <= 30 ) {
        percentage = 0;
      }

      this.$label.innerText = `${percentage}%`;
      this._updateLabel();
    });
  },
});
