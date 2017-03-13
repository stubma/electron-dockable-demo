'use strict';

// a global color picker
let _colorPicker;

// requires
const Chroma = require('chroma-js');

const ElementUtils = require('./utils');
const ResMgr = require('../utils/resource-mgr');
const DomUtils = require('../utils/dom-utils');
const FocusMgr = require('../utils/focus-mgr');
const Focusable = require('../behaviors/focusable');
const Disable = require('../behaviors/disable');
const Readonly = require('../behaviors/readonly');

module.exports = ElementUtils.registerElement('ui-color', {
  /**
   * @property value
   */
  get value () { return this._value; },
  set value (val) {
    let rgba = Chroma(val).rgba();
    if ( rgba !== this._value ) {
      this._value = rgba;

      this._updateRGB();
      this._updateAlpha();
    }
  },

  behaviors: [ Focusable, Disable, Readonly ],

  template: `
    <div class="inner">
      <div class="rgb"></div>
      <div class="alpha"></div>
    </div>
    <div class="mask"></div>
  `,

  style: ResMgr.getResource('theme://elements/color.css'),

  $: {
    rgb: '.rgb',
    alpha: '.alpha',
  },

  factoryImpl (color) {
    if ( color ) {
      this.value = color;
    }
  },

  ready () {
    this._showing = false;

    // init _value
    let value = this.getAttribute('value');
    if ( value !== null ) {
      this._value = Chroma(value).rgba();
    } else {
      this._value = [255,255,255,1];
    }

    // update control
    this._updateRGB();
    this._updateAlpha();

    //
    this._initFocusable(this);
    this._initDisable(false);
    this._initReadonly(false);
    this._initEvents();

    // init global color-picker
    if ( !_colorPicker ) {
      _colorPicker = document.createElement('ui-color-picker');
      _colorPicker.style.position = 'fixed';
      _colorPicker.style.zIndex = 999;
      _colorPicker.style.display = 'none';
    }
  },

  _initEvents () {
    this.addEventListener('mousedown', event => {
      if ( this.disabled ) {
        return;
      }

      DomUtils.acceptEvent(event);

      FocusMgr._setFocusElement(this);

      if ( this.readonly ) {
        return;
      }

      if ( this._showing ) {
        this._showColorPicker(false);
      } else {
        _colorPicker.value = this._value;
        this._showColorPicker(true);
      }
    });

    this.addEventListener('keydown', event => {
      if ( this.readonly || this.disabled ) {
        return;
      }

      // space or enter
      if (
        event.keyCode === 13 ||
        event.keyCode === 32
      ) {
        DomUtils.acceptEvent(event);

        _colorPicker.value = this._value;
        this._showColorPicker(true);
      }
    });

    // color picker events
    this._hideFn = event => {
      if ( this._changed ) {
        this._changed = false;

        if ( event.detail.confirm ) {
          this._initValue = this._value;

          DomUtils.fire(this, 'confirm', {
            bubbles: false,
            detail: {
              value: this._value,
            },
          });
        } else {
          if ( this._initValue !== this._value ) {
            this.value = this._initValue;

            DomUtils.fire(this, 'change', {
              bubbles: false,
              detail: {
                value: this._value,
              },
            });
          }

          DomUtils.fire(this, 'cancel', {
            bubbles: false,
            detail: {
              value: this._value,
            },
          });
        }
      }

      this._showColorPicker(false);
    };

    this._changeFn = event => {
      this._changed = true;

      DomUtils.acceptEvent(event);
      this.value = event.detail.value;

      DomUtils.fire(this, 'change', {
        bubbles: false,
        detail: {
          value: this._value,
        },
      });
    };
  },

  _updateRGB () {
    this.$rgb.style.backgroundColor = Chroma(this._value).hex();
  },

  _updateAlpha () {
    this.$alpha.style.width = `${this._value[3]*100}%`;
  },

  _equals ( val ) {
    if ( this._value.length !== val.length ) {
      return false;
    }

    return this._value[0] === val[0]
      && this._value[1] === val[1]
      && this._value[2] === val[2]
      && this._value[3] === val[3]
      ;
  },

  _showColorPicker (show) {
    if ( this._showing === show ) {
      return;
    }

    // DISABLE
    // // if the color-picker is showing for different target, hide it first
    // if ( _colorPicker._target && _colorPicker._target !== this ) {
    //   let target = _colorPicker._target;
    //   target._showColorPicker(false);
    // }

    this._showing = show;
    if ( show ) {
      this._initValue = this._value;

      // add event listeners
      _colorPicker.addEventListener('hide', this._hideFn);
      _colorPicker.addEventListener('change', this._changeFn);
      _colorPicker.addEventListener('confirm', this._confirmFn);
      _colorPicker.addEventListener('cancel', this._cancelFn);

      // hit-ghost
      // NOTE: we use transparent hit-ghost because we want artist adjust color in the scene without any mask
      DomUtils.addHitGhost('default', 998, () => {
        _colorPicker.hide(true); // hide & confirm
      });

      // color-picker
      document.body.appendChild( _colorPicker );
      _colorPicker._target = this;
      _colorPicker.style.display = 'block';
      this._updateColorPickerPosition();

      // focus-mgr
      FocusMgr._setFocusElement(_colorPicker);
    } else {
      // remove event listeners
      _colorPicker.removeEventListener('hide', this._hideFn);
      _colorPicker.removeEventListener('change', this._changeFn);
      _colorPicker.removeEventListener('confirm', this._confirmFn);
      _colorPicker.removeEventListener('cancel', this._cancelFn);

      // hit-ghost
      DomUtils.removeHitGhost();

      // color-picker
      _colorPicker._target = null;
      _colorPicker.remove();
      _colorPicker.style.display = 'none';

      // focus-mgr
      FocusMgr._setFocusElement(this);
    }
  },

  _updateColorPickerPosition () {
    window.requestAnimationFrame( () => {
      if ( !this._showing ) {
        return;
      }

      let bodyRect = document.body.getBoundingClientRect();
      let thisRect = this.getBoundingClientRect();
      let colorPickerRect = _colorPicker.getBoundingClientRect();

      let style = _colorPicker.style;
      style.left = (thisRect.right - colorPickerRect.width) + 'px';

      if ( bodyRect.height - thisRect.bottom <= colorPickerRect.height + 10 ) {
        // style.top = (thisRect.top - bodyRect.top - colorPickerRect.height - 10) + 'px';
        style.top = (bodyRect.bottom - colorPickerRect.height - 10) + 'px';
      } else {
        style.top = (thisRect.bottom - bodyRect.top + 10) + 'px';
      }

      if ( bodyRect.width - thisRect.left <= colorPickerRect.width ) {
        // style.left = (thisRect.right - bodyRect.left - colorPickerRect.width) + 'px';
        style.left = (bodyRect.right - colorPickerRect.width - 10) + 'px';
      } else {
        style.left = (thisRect.left - bodyRect.left) + 'px';
      }

      this._updateColorPickerPosition();
    });
  },
});
