'use strict';

// requires
const ElementUtils = require('./utils');
const ResMgr = require('../utils/resource-mgr');
const DomUtils = require('../utils/dom-utils');
const FocusMgr = require('../utils/focus-mgr');
const Focusable = require('../behaviors/focusable');
const Disable = require('../behaviors/disable');
const Readonly = require('../behaviors/readonly');

module.exports = ElementUtils.registerElement('ui-select', {
  /**
   * @property value
   */
  get value () {
    return this._value;
  },
  set value (val) {
    if ( this._value !== val ) {
      this._value = val;
      this.$select.value = val;
    }
  },

  /**
   * @property selectedIndex
   */
  get selectedIndex () {
    return this.$select.selectedIndex;
  },
  set selectedIndex (val) {
    this.$select.selectedIndex = val;
  },

  /**
   * @property selectedText
   */
  get selectedText () {
    return this.$select.item(this.$select.selectedIndex).text;
  },

  behaviors: [ Focusable, Disable, Readonly ],

  template: `
    <select></select>
  `,

  style: ResMgr.getResource('theme://elements/select.css'),

  $: {
    select: 'select',
  },

  factoryImpl ( value ) {
    if ( !isNaN(value) ) {
      this.value = value;
    }
  },

  ready () {
    // observe option and optgroup
    this._observer = new MutationObserver(mutations => {
      // TODO: optimize me, but how ???
      unused(mutations);
      this._updateItems();
    });
    this._observer.observe(this, {
      childList: true
    });

    // init $select
    for ( let i = 0; i < this.children.length; ++i ) {
      let el = this.children[i];
      if (
        el instanceof HTMLOptionElement ||
        el instanceof HTMLOptGroupElement
      ) {
        let cloneEL = el.cloneNode(true);
        this.$select.add(cloneEL, null);
      }
    }

    let initValue = this.getAttribute('value');
    if ( initValue !== null ) {
      this._value = initValue;
      this.$select.value = initValue;
    } else {
      this._value = this.$select.value;
    }

    // init focusable
    this._initFocusable(this.$select);
    this._initDisable(false);
    this._initReadonly(false);

    // process events
    this.addEventListener('mousedown', this._mouseDownHandler);

    this.$select.addEventListener('keydown', event => {
      if ( this.disabled ) {
        event.preventDefault();
        return;
      }

      if ( this.readonly ) {
        event.preventDefault();
        return;
      }

      // arrow-up & arrow-down should be used as navigation
      if (
        event.keyCode === 38 ||
        event.keyCode === 40
      ) {
        event.preventDefault();
      }

      // if this is not space key, prevent typing for select
      if ( event.keyCode !== 32 && !event.ctrlKey && !event.metaKey ) {
        event.preventDefault();
      }
    });

    this.$select.addEventListener('change', event => {
      DomUtils.acceptEvent(event);
      this._value = this.$select.value;

      DomUtils.fire(this, 'change', {
        bubbles: false,
        detail: {
          index: this.selectedIndex,
          value: this.value,
          text: this.selectedText,
        },
      });

      DomUtils.fire(this, 'confirm', {
        bubbles: false,
        detail: {
          index: this.selectedIndex,
          value: this.value,
          text: this.selectedText,
        },
      });
    });
  },

  _mouseDownHandler (event) {
    event.stopPropagation();

    this._mouseStartX = event.clientX;
    if ( !this._inputFocused ) {
      this._selectAllWhenMouseUp = true;
    }
    FocusMgr._setFocusElement(this);

    if ( this.readonly ) {
      DomUtils.acceptEvent(event);
      return;
    }
  },

  _updateItems () {
    DomUtils.clear(this.$select);

    for ( let i = 0; i < this.children.length; ++i ) {
      let el = this.children[i];
      if (
        el instanceof HTMLOptionElement ||
        el instanceof HTMLOptGroupElement
      ) {
        let cloneEL = el.cloneNode(true);
        this.$select.add(cloneEL, null);
      }
    }

    this.$select.value = this._value;
  },

  addItem (value, text, beforeIndex) {
    let optEL = document.createElement('option');
    optEL.value = value;
    optEL.text = text;

    this.addElement(optEL, beforeIndex);
  },

  addElement (el, beforeIndex) {
    if (
      !(el instanceof HTMLOptionElement) &&
      !(el instanceof HTMLOptGroupElement)
    ) {
      return;
    }

    // close observer
    this._observer.disconnect();

    // insert to this
    if ( beforeIndex !== undefined ) {
      this.insertBefore( el, this.children[beforeIndex] );
    } else {
      this.appendChild( el );
    }

    // copy to $select
    let beforeEL;
    if ( beforeIndex !== undefined ) {
      beforeEL = this.$select.item(beforeIndex);
    } else {
      beforeEL = null;
    }
    this.$select.add( el.cloneNode(true), beforeEL );

    // restart observer
    this._observer.observe(this, {
      childList: true
    });
  },

  // NOTE: do not use remove which is DOM function
  removeItem (index) {
    this.$select.remove(index);
  },

  clear () {
    DomUtils.clear(this.$select);

    this._value = null;
    this.$select.value = null;
  },
});
