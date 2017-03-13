'use strict';

// requires
const Settings = require('../settings');
const ElementUtils = require('./utils');
const Utils = require('../../../share/utils');
const ResMgr = require('../utils/resource-mgr');
const DomUtils = require('../utils/dom-utils');
const FocusMgr = require('../utils/focus-mgr');
const Focusable = require('../behaviors/focusable');
const Disable = require('../behaviors/disable');
const Readonly = require('../behaviors/readonly');
const InputState = require('../behaviors/input-state');

module.exports = ElementUtils.registerElement('ui-num-input', {
  /**
   * @property type
   */
  get type () { return this._type; },
  set type ( val ) {
    if ( this._type !== val ) {
      this._type = val;

      // re-assign _parseFn, _step
      if ( this._type === 'int' ) {
        this._parseFn = parseInt;

        this._step = parseInt(this._step);
        this._step = this._step === 0 ? Settings.stepInt : this._step;
      } else {
        this._parseFn = parseFloat;

        this._step = parseFloat(this._step);
        this._step = this._step === 0 ? Settings.stepFloat : this._step;
      }
    }
  },

  /**
   * @property value
   */
  get value () { return this._value; },
  set value ( val ) {
    if ( val === null || val === undefined ) {
      val = 0;
    }

    val = this._clampValue(val);
    if ( this._value !== val ) {
      this._value = this._parseFn(val);
      this.$input.value = this._formatValue(this._value);
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
      this._min = this._parseFn(val);

      // re-assign to invoke the value clamp
      this.value = this._value;
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
      this._max = this._parseFn(val);

      // re-assign to invoke the value clamp
      this.value = this._value;
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
      this.$input.value = this._formatValue(this._value);
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
      this._step = this._parseFn(val);

      if ( this._type === 'int' ) {
        this._step = this._step === 0 ? Settings.stepInt : this._step;
      } else {
        this._step = this._step === 0 ? Settings.stepFloat : this._step;
      }
    }
  },

  behaviors: [ Focusable, Disable, Readonly, InputState ],

  template: `
    <input></input>
    <div class="spin-wrapper" tabindex="-1">
      <div class="spin up">
        <i class="icon-up-dir"></i>
      </div>
      <div class="spin-div"></div>
      <div class="spin down">
        <i class="icon-down-dir"></i>
      </div>
    </div>
  `,

  style: ResMgr.getResource('theme://elements/num-input.css'),

  $: {
    input: 'input',
    spinWrapper: '.spin-wrapper',
    spinUp: '.spin.up',
    spinDown: '.spin.down',
  },

  factoryImpl (value) {
    if ( !isNaN(value) ) {
      this.value = value;
    }
  },

  ready () {
    // init _type (can be 'int' or 'float')
    let type = this.getAttribute('type');
    if ( type === 'int' ) {
      this._type = 'int';
      this._parseFn = parseInt;
    } else {
      this._type = 'float';
      this._parseFn = parseFloat;
    }

    // init _precision
    let precision = this.getAttribute('precision');
    if ( precision !== null ) {
      this._precision = parseInt(precision);
    } else {
      this._precision = 7;
    }

    // init _min
    let min = this.getAttribute('min');
    if ( min !== null ) {
      this._min = this._parseFn(min);
    } else {
      this._min = null;
    }

    // init _max
    let max = this.getAttribute('max');
    if ( max !== null ) {
      this._max = this._parseFn(max);
    } else {
      this._max = null;
    }

    // init _value
    let value = this.getAttribute('value');
    if ( value !== null ) {
      this._value = this._parseFn(value);
    } else {
      this._value = null;
    }
    this._value = this._clampValue(this._value);

    // init _step
    let step = this.getAttribute('step');
    if ( step !== null ) {
      this._step = this._parseFn(step);
    } else {
      this._step = this._type === 'int' ? Settings.stepInt : Settings.stepFloat;
    }

    // init $input
    this.$input.value = this._formatValue(this._value);
    this.$input.placeholder = '-';
    this.$input._initValue = '';

    // init $spinWrapper
    this.$spinWrapper.addEventListener('keydown', event => {
      // keydown 'esc'
      if (event.keyCode === 27) {
        if ( this._holdingID ) {
          DomUtils.acceptEvent(event);

          this.cancel();
          this._curSpin.removeAttribute('pressed');
          this._stopHolding();
        }
      }
    });

    // init $spinUp
    DomUtils.installDownUpEvent(this.$spinUp);

    this.$spinUp.addEventListener('down', event => {
      DomUtils.acceptEvent(event);

      FocusMgr._setFocusElement(this);
      this.$spinWrapper.focus();
      this.$spinUp.setAttribute('pressed', '');

      if ( !this.readonly ) {
        this._stepUp();

        // process holding
        this._startHolding(this.$spinUp, this._stepUp);
      }
    });
    this.$spinUp.addEventListener('up', event => {
      DomUtils.acceptEvent(event);
      this.$spinUp.removeAttribute('pressed', '');

      if ( this._holdingID ) {
        this._stopHolding();
        this.confirm();
      }
    });

    // init $spinDown
    DomUtils.installDownUpEvent(this.$spinDown);

    this.$spinDown.addEventListener('down', event => {
      DomUtils.acceptEvent(event);

      FocusMgr._setFocusElement(this);
      this.$spinWrapper.focus();
      this.$spinDown.setAttribute('pressed', '');

      if ( !this.readonly ) {
        this._stepDown();

        // process holding
        this._startHolding(this.$spinDown, this._stepDown);
      }
    });
    this.$spinDown.addEventListener('up', event => {
      DomUtils.acceptEvent(event);
      this.$spinDown.removeAttribute('pressed', '');

      if ( this._holdingID ) {
        this._stopHolding();
        this.confirm();
      }
    });

    //
    this._initFocusable(this, this.$input);
    this._initDisable(false);
    this._initReadonly(false);
    this._initInputState(this.$input);

    this.$input.readOnly = this.readonly;

    //
    this._initEvents();
  },

  // NOTE: override Readonly behavior
  _setIsReadonlyAttribute ( readonly ) {
    if ( readonly ) {
      this.setAttribute('is-readonly', '');
    } else {
      this.removeAttribute('is-readonly');
    }
    this.$input.readOnly = readonly;
  },

  _initEvents () {
    this.addEventListener('mousedown', this._mouseDownHandler);
    this.addEventListener('keydown', this._keyDownHandler);
    this.addEventListener('focus-changed', this._focusChangedHandler);

    // DISABLE
    // this.$input.addEventListener('keydown', event => {
    //   // keydown 'up'
    //   if (event.keyCode === 38) {
    //     event.preventDefault();
    //     if (!this.readonly) {
    //       this._stepUp();
    //     }
    //   }
    //   // keydown 'down'
    //   else if (event.keyCode === 40) {
    //     event.preventDefault();
    //     if (!this.readonly) {
    //       this._stepDown();
    //     }
    //   }
    // });
  },

  _formatValue (val) {
    if ( val === null || val === '' ) {
      return '';
    }

    if ( this._type === 'int' ) {
      return Utils.toFixed(val, 0);
    } else {
      if ( this._precision === 0 ) {
        return Utils.toFixed(val, this._precision);
      } else {
        return Utils.toFixed(val, this._precision, this._precision);
      }
    }
  },

  _clampValue (val) {
    if ( this._min !== null && this._min !== undefined ) {
      val = Math.max( this._min, val );
    }

    if ( this._max !== null && this._max !== undefined ) {
      val = Math.min( this._max, val );
    }

    return val;
  },

  _parseInput () {
    if ( this.$input.value === null ) {
      return 0;
    }

    let inputValue = this.$input.value.trim();
    if ( inputValue === '' ) {
      return 0;
    }

    let val = this._parseFn(this.$input.value);
    if ( isNaN(val) ) {
      val = this._parseFn(this.$input._initValue);
      val = this._parseFn(this._formatValue(val));
    } else {
      val = this._parseFn(this._formatValue(val));
    }

    return val;
  },

  _stepUp () {
    let val = this._value + this._step;
    val = this._clampValue(val);

    this.$input.value = this._formatValue(val);
    this._onInputChange();
  },

  _stepDown () {
    let val = this._value - this._step;
    val = this._clampValue(val);

    this.$input.value = this._formatValue(val);
    this._onInputChange();
  },

  _startHolding ( spin, fn ) {
    this._curSpin = spin;
    this._holdingID = setTimeout(() => {
      this._stepingID = setInterval(() => {
        fn.apply(this);
      }, 50);
    }, 500);
  },

  _stopHolding () {
    clearInterval(this._holdingID);
    this._holdingID = null;

    clearTimeout(this._stepingID);
    this._stepingID = null;

    this._curSpin = null;
  },

  clear () {
    this.$input.value = '';
    this.confirm();
  },

  confirm () {
    this._onInputConfirm(this.$input);
  },

  cancel () {
    this._onInputCancel(this.$input);
  },

  _onInputConfirm ( inputEL, pressEnter ) {
    if ( !this.readonly ) {
      if ( this._changed ) {
        this._changed = false;
        let value = this._parseInput();
        value = this._clampValue(value);
        let valueText = this._formatValue(value);

        inputEL.value = valueText;
        inputEL._initValue = valueText;
        this._value = value;

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
      // blur inputEL, focus to :host
      this.focus();
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
          let valueText = this._formatValue(value);

          inputEL.value = valueText;
          inputEL._initValue = valueText;
          this._value = value;

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
      // blur inputEL, focus to :host
      inputEL.blur();
      this.focus();
    }
  },

  _onInputChange () {
    this._changed = true;
    this._value = this._parseInput();

    DomUtils.fire(this, 'change', {
      bubbles: false,
      detail: {
        value: this._value,
      },
    });
  },

  _mouseDownHandler (event) {
    event.stopPropagation();
    FocusMgr._setFocusElement(this);
  },

  _keyDownHandler (event) {
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

    // DISABLE
    // // keydown 'esc'
    // else if (event.keyCode === 27) {
    //   DomUtils.acceptEvent(event);
    //   // FocusMgr._focusParent(this); // DISABLE
    //   this.focus();
    // }
  },

  _focusChangedHandler () {
    if ( this.focused ) {
      this.$input._initValue = this.$input.value;
    } else {
      this._unselect(this.$input);
    }
  },
});
