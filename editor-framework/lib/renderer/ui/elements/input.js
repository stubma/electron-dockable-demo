'use strict';

// requires
const ElementUtils = require('./utils');
const ResMgr = require('../utils/resource-mgr');
const DomUtils = require('../utils/dom-utils');
const FocusMgr = require('../utils/focus-mgr');
const Focusable = require('../behaviors/focusable');
const Disable = require('../behaviors/disable');
const Readonly = require('../behaviors/readonly');
const InputState = require('../behaviors/input-state');

module.exports = ElementUtils.registerElement('ui-input', {
  get value () { return this.$input.value; },
  set value ( val ) {
    if ( val === null || val === undefined ) {
      val = '';
    }
    this.$input.value = val;
  },

  get placeholder () { return this.$input.placeholder; },
  set placeholder ( val ) {
    this.$input.placeholder = val;
  },

  behaviors: [ Focusable, Disable, Readonly, InputState ],

  template: `
    <input></input>
  `,

  style: ResMgr.getResource('theme://elements/input.css'),

  $: {
    input: 'input',
  },

  factoryImpl (text) {
    if ( text ) {
      this.value = text;
    }
  },

  ready () {
    // init $input
    this.$input.value = this.getAttribute('value');
    this.$input.placeholder = this.getAttribute('placeholder') || '';

    //
    this._initFocusable(this, this.$input);
    this._initDisable(false);
    this._initReadonly(false);
    this._initInputState(this.$input);

    this.$input.readOnly = this.readonly;

    //
    this._initEvents();
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
  },

  _onInputConfirm ( inputEL, pressEnter ) {
    if ( !this.readonly ) {
      if ( this._changed ) {
        this._changed = false;
        inputEL._initValue = inputEL.value;

        DomUtils.fire(this, 'confirm', {
          bubbles: false,
          detail: {
            value: inputEL.value,
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

          DomUtils.fire(this, 'change', {
            bubbles: false,
            detail: {
              value: inputEL.value,
            },
          });
        }

        DomUtils.fire(this, 'cancel', {
          bubbles: false,
          detail: {
            value: inputEL.value,
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

  _onInputChange ( inputEL ) {
    this._changed = true;

    DomUtils.fire(this, 'change', {
      bubbles: false,
      detail: {
        value: inputEL.value,
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
