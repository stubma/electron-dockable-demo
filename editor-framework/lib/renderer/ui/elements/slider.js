'use strict';

// ==========================
// internal
// ==========================

// requires
const Settings = require('../settings');
const ElementUtils = require('./utils');
const Utils = require('../../../share/utils');
const MathUtils = require('../../../share/math');
const ResMgr = require('../utils/resource-mgr');
const DomUtils = require('../utils/dom-utils');
const FocusMgr = require('../utils/focus-mgr');
const Focusable = require('../behaviors/focusable');
const Disable = require('../behaviors/disable');
const Readonly = require('../behaviors/readonly');
const InputState = require('../behaviors/input-state');

module.exports = ElementUtils.registerElement('ui-slider', {
  /**
   * @property value
   */
  get value () { return this._value; },
  set value (val) {
    if ( val === null || val === undefined ) {
      val = 0;
    }

    val = MathUtils.clamp(val, this._min, this._max);
    if ( this._value !== val ) {
      this._value = val;
      this._updateNubbinAndInput();
    }
  },

  /**
   * @property min
   */
  get min () { return this._min; },
  set min ( val ) {
    if ( val === null || val === undefined ) {
      this._min = null;
      return;
    }

    if ( this._min !== val ) {
      this._min = parseFloat(val);

      // TODO: update value
    }
  },

  /**
   * @property max
   */
  get max () { return this._max; },
  set max ( val ) {
    if ( val === null || val === undefined ) {
      this._max = null;
      return;
    }

    if ( this._max !== val ) {
      this._max = parseFloat(val);

      // TODO: update value
    }
  },

  /**
   * @property precision
   */
  get precision () { return this._precision; },
  set precision ( val ) {
    if ( val === undefined || val === null ) {
      return;
    }

    if ( this._precision !== val ) {
      this._precision = parseInt(val);

      // TODO: update value
    }
  },

  /**
   * @property step
   */
  get step () { return this._step; },
  set step ( val ) {
    if ( val === undefined || val === null ) {
      return;
    }

    if ( this._step !== val ) {
      this._step = parseFloat(val);
      this._step = this._step === 0 ? Settings.stepFloat : this._step;
    }
  },

  behaviors: [ Focusable, Disable, Readonly, InputState ],

  template: `
    <div class="wrapper">
      <div class="track"></div>
      <div class="nubbin"></div>
    </div>
    <input></input>
  `,

  style: ResMgr.getResource('theme://elements/slider.css'),

  $: {
    wrapper: '.wrapper',
    track: '.track',
    nubbin: '.nubbin',
    input: 'input',
  },

  factoryImpl ( value ) {
    if ( !isNaN(value) ) {
      this.value = value;
    }
  },

  ready () {
    // init _precision
    let precision = this.getAttribute('precision');
    if ( precision !== null ) {
      this._precision = parseInt(precision);
    } else {
      this._precision = 1;
    }

    // init _min
    let attrMin = this.getAttribute('min');
    this._min = attrMin !== null ? parseFloat(attrMin) : 0.0;

    // init _max
    let attrMax = this.getAttribute('max');
    this._max = attrMax !== null ? parseFloat(attrMax) : 1.0;

    // init _value
    let attrValue = this.getAttribute('value');
    this._value = attrValue !== null ? parseFloat(attrValue) : 0.0;
    this._value = this._initValue = MathUtils.clamp( this._value, this._min, this._max );

    // init _step
    let step = this.getAttribute('step');
    if ( step !== null ) {
      step = parseFloat(step);
    } else {
      step = (this._max - this._min)/10;
    }
    this._step = step === 0 ? Settings.stepFloat : step;

    //
    this._dragging = false;
    this._updateNubbinAndInput();

    //
    this._initFocusable([this.$wrapper, this.$input], this.$input);
    this._initDisable(false);
    this._initReadonly(false);
    this._initInputState(this.$input);

    this.$input.readOnly = this.readonly;

    //
    this._initEvents();
  },

  _initEvents () {
    this.addEventListener('mousedown', this._mouseDownHandler);
    this.addEventListener('focus-changed', this._focusChangedHandler);

    this.$wrapper.addEventListener('keydown', this._wrapperKeyDownHandler.bind(this));
    this.$wrapper.addEventListener('keyup', this._wrapperKeyUpHandler.bind(this));
    this.$wrapper.addEventListener('mousedown', this._wrapperMouseDownHandler.bind(this));

    this.$input.addEventListener('keydown', event => {
      event.stopPropagation();
    });
    this.$input.addEventListener('keyup', event => {
      event.stopPropagation();
    });
    this.$input.addEventListener('keypress', event => {
      event.stopPropagation();
    });
    this.$input.addEventListener('change', event => {
      event.stopPropagation();
    });
  },

  _mouseDownHandler (event) {
    DomUtils.acceptEvent(event);
    FocusMgr._setFocusElement(this);
  },

  _wrapperMouseDownHandler (event) {
    DomUtils.acceptEvent(event);
    FocusMgr._setFocusElement(this);
    this.$wrapper.focus();

    if ( this.readonly ) {
      return;
    }

    this._initValue = this._value;
    this._dragging = true;

    let rect = this.$track.getBoundingClientRect();
    let ratio = (event.clientX - rect.left)/this.$track.clientWidth;
    let val = this._min + ratio * (this._max - this._min);
    let valText = this._formatValue(val);

    this.$nubbin.style.left = `${ratio*100}%`;
    this.$input.value = valText;
    this._value = parseFloat(valText);

    this._emitChange();

    DomUtils.startDrag('ew-resize', event, event => {
      let ratio = (event.clientX - rect.left)/this.$track.clientWidth;
      ratio = MathUtils.clamp( ratio, 0, 1 );
      let val = this._min + ratio * (this._max - this._min);
      let valText = this._formatValue(val);

      this.$nubbin.style.left = `${ratio*100}%`;
      this.$input.value = valText;
      this._value = parseFloat(valText);

      this._emitChange();
    }, () => {
      this._dragging = false;
      this.confirm();
    });
  },

  _wrapperKeyDownHandler (event) {
    if ( this.disabled ) {
      return;
    }

    // keydown 'enter' or 'space'
    if (event.keyCode === 13 || event.keyCode === 32) {
      DomUtils.acceptEvent(event);

      this.$input._initValue = this.$input.value;
      this.$input.focus();
      this.$input.select();
    }
    // keydown 'esc'
    else if (event.keyCode === 27) {
      if ( this._dragging ) {
        DomUtils.acceptEvent(event);

        this._dragging = false;
        DomUtils.cancelDrag();
      }
      this.cancel();
    }
    // left-arrow
    else if ( event.keyCode === 37 ) {
      DomUtils.acceptEvent(event);

      if ( this.readonly ) {
        return;
      }

      let step = this._step;
      if ( event.shiftKey ) {
        step *= Settings.shiftStep;
      }
      this._value = MathUtils.clamp(this._value-step, this._min, this._max);
      this._updateNubbinAndInput();

      this._emitChange();
    }
    // right-arrow
    else if ( event.keyCode === 39 ) {
      DomUtils.acceptEvent(event);

      if ( this.readonly ) {
        return;
      }

      let step = this._step;
      if ( event.shiftKey ) {
        step *= Settings.shiftStep;
      }
      this._value = MathUtils.clamp(this._value+step, this._min, this._max);
      this._updateNubbinAndInput();

      this._emitChange();
    }
  },

  _wrapperKeyUpHandler (event) {
    // left-arrow or right-arrow
    if (
      event.keyCode === 37 ||
      event.keyCode === 39
    ) {
      DomUtils.acceptEvent(event);

      if ( this.readonly ) {
        return;
      }

      this.confirm();
    }
  },

  _parseInput () {
    if ( this.$input.value === null ) {
      return this._min;
    }

    let inputValue = this.$input.value.trim();
    if ( inputValue === '' ) {
      return this._min;
    }

    let val = parseFloat(this.$input.value);
    if ( isNaN(val) ) {
      val = parseFloat(this.$input._initValue);
      val = parseFloat(this._formatValue(val));
    } else {
      val = parseFloat(this._formatValue(val));
    }

    val = MathUtils.clamp( val, this._min, this._max );

    return val;
  },

  _updateNubbin () {
    let ratio = (this._value-this._min)/(this._max-this._min);
    this.$nubbin.style.left = `${ratio*100}%`;
  },

  _updateNubbinAndInput () {
    let ratio = (this._value-this._min)/(this._max-this._min);
    this.$nubbin.style.left = `${ratio*100}%`;
    this.$input.value = this._formatValue(this._value);
  },

  confirm () {
    if ( !this._changed ) {
      return;
    }

    this._changed = false;
    this._initValue = this._value;
    this._updateNubbinAndInput();

    DomUtils.fire(this, 'confirm', {
      bubbles: false,
      detail: {
        value: this._value,
      },
    });
  },

  cancel () {
    if ( !this._changed ) {
      return;
    }

    this._changed = false;

    // reset to init value and emit change event
    if ( this._value !== this._initValue ) {
      this._value = this._initValue;
      this._updateNubbinAndInput();

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
  },

  _onInputConfirm ( inputEL, pressEnter ) {
    if ( !this.readonly ) {
      if ( this._changed ) {
        this._changed = false;
        let value = this._parseInput();

        inputEL.value = value;
        inputEL._initValue = value;

        this._value = value;
        this._initValue = value;
        this._updateNubbin();

        DomUtils.fire(this, 'confirm', {
          bubbles: false,
          detail: {
            value: this._value,
            confirmByEnter: pressEnter,
          },
        });
      }
    }

    if ( pressEnter ) {
      // blur inputEL, focus to wrapper
      this.$wrapper.focus();
    }
  },

  _onInputCancel ( inputEL, pressEsc ) {
    if ( !this.readonly ) {
      if ( this._changed ) {
        this._changed = false;

        // reset to init value and emit change event
        if ( inputEL._initValue !== inputEL.value ) {
          inputEL.value = inputEL._initValue;
          let value = this._parseInput();

          inputEL.value = value;
          this._value = value;
          this._initValue = value;
          this._updateNubbin();

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
            cancelByEsc: pressEsc,
          },
        });
      }
    }

    if ( pressEsc ) {
      // blur inputEL, focus to wrapper
      this.$wrapper.focus();
    }
  },

  _onInputChange () {
    let value = this._parseInput();

    this._value = value;
    this._updateNubbin();

    this._emitChange();
  },

  _focusChangedHandler () {
    if ( !this.focused ) {
      this._unselect(this.$input);
    }
  },

  _emitChange () {
    this._changed = true;

    DomUtils.fire(this, 'change', {
      bubbles: false,
      detail: {
        value: this._value,
      },
    });
  },

  _formatValue (val) {
    if ( val === null || val === '' ) {
      return '';
    }

    if ( this._precision === 0 ) {
      return Utils.toFixed(val, this._precision);
    }

    return Utils.toFixed(val, this._precision, this._precision);
  },
});
