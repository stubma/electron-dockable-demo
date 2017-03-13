'use strict';

// ==========================
// internal
// ==========================

const ElementUtils = require('./utils');
const ResMgr = require('../utils/resource-mgr');
const DomUtils = require('../utils/dom-utils');
const FocusMgr = require('../utils/focus-mgr');
const Focusable = require('../behaviors/focusable');
const Disable = require('../behaviors/disable');
const Readonly = require('../behaviors/readonly');
const Hint = require('./hint');

let _tooltipEL = null;

let PropElement = ElementUtils.registerElement('ui-prop', {
  /**
   * @property name
   */
  get name () {
    return this._name;
  },
  set name (val) {
    if (this._name !== val) {
      this._name = val;
      this.$text.innerText = val;
    }
  },

  /**
   * @property slidable
   */
  get slidable () {
    return this.getAttribute('slidable') !== null;
  },
  set slidable (val) {
    if (val) {
      this.setAttribute('slidable', '');
    } else {
      this.removeAttribute('slidable');
    }
  },

  /**
   * @property movable
   */
  get movable () {
    return this.getAttribute('movable') !== null;
  },
  set movable (val) {
    if (val) {
      this.setAttribute('movable', '');
    } else {
      this.removeAttribute('movable');
    }
  },

  /**
   * @property removable
   */
  get removable () {
    return this.getAttribute('removable') !== null;
  },
  set removable (val) {
    if (val) {
      this.setAttribute('removable', '');
    } else {
      this.removeAttribute('removable');
    }
  },

  /**
   * @property foldable
   */
  get foldable () {
    return this.getAttribute('foldable') !== null;
  },
  set foldable (val) {
    if (val) {
      this.setAttribute('foldable', '');
    } else {
      this.removeAttribute('foldable');
    }
  },

  /**
   * @property autoHeight
   */
  get autoHeight () {
    return this.getAttribute('auto-height') !== null;
  },
  set autoHeight (val) {
    if (val) {
      this.setAttribute('auto-height', '');
    } else {
      this.removeAttribute('auto-height');
    }
  },

  /**
   * @property selected
   */
  get selected () {
    return this.getAttribute('selected') !== null;
  },
  set selected (val) {
    if (val) {
      this.setAttribute('selected', '');
    } else {
      this.removeAttribute('selected');
    }
  },

  /**
   * @property hovering
   */
  get hovering () {
    return this.getAttribute('hovering') !== null;
  },
  set hovering (val) {
    if (val) {
      this.setAttribute('hovering', '');
    } else {
      this.removeAttribute('hovering');
    }
  },

  /**
   * @property indent
   */
  get indent () {
    return this._indent;
  },
  set indent (val) {
    if (this._indent !== val) {
      let indent = parseInt(val);
      this.setAttribute('indent', indent);
      this.$label.style.paddingLeft = indent * 13 + 'px';
      this._indent = indent;
    }
  },

  /**
   * @property value
   */
  get value () {
    return this._value;
  },
  set value (val) {
    if (this._value !== val) {
      let old = this._value;
      this._value = val;

      if ( this.valueChanged ) {
        this.valueChanged(old,val);
      }
    }
  },

  /**
   * @property attrs
   */
  get attrs () {
    return this._attrs;
  },
  set attrs (val) {
    if (this._attrs !== val) {
      let old = this._attrs;
      this._attrs = val;

      if ( this.attrsChanged ) {
        this.attrsChanged(old,val);
      }
    }
  },

  /**
   * @property type
   */
  set type (val) {
    if (this._type !== val) {
      this._type = val;
      if ( this._type !== null ) {
        this.regen();
      }
    }
  },
  get type () {
    return this._type;
  },

  /**
   * @property tooltip
   */
  get tooltip () {
    return this._tooltip;
  },
  set tooltip (val) {
    if (this._tooltip !== val) {
      this._tooltip = val;
    }
  },

  /**
   * @property path
   */
  get path () {
    return this._path;
  },

  behaviors: [ Focusable, Disable, Readonly ],

  template: `
    <div class="wrapper">
      <div class="label">
        <i class="move icon-braille"></i>
        <i class="fold icon-fold-up"></i>
        <span class="text"></span>
        <div class="lock">
          <i class="icon-lock"></i>
        </div>
      </div>
      <div class="wrapper-content">
        <content select=":not(.child)"></content>
      </div>
      <div class="remove">
        <i class="icon-trash-empty"></i>
      </div>
    </div>
    <content select=".child"></content>
  `,

  style: ResMgr.getResource('theme://elements/prop.css'),

  $: {
    label: '.label',
    moveIcon: '.move',
    removeIcon: '.remove',
    foldIcon: '.fold',
    text: '.text',
  },

  factoryImpl ( name, value, type, attrs, indent ) {
    this.name = name || '';
    this.indent = indent || 0;

    this._value = value;
    this._attrs = attrs || {};
    this._type = type || typeof value;

    this.regen();
  },

  ready () {
    // init _name
    let name = this.getAttribute('name');
    if ( name !== null ) {
      this._name = name;
    } else {
      this._name = '-';
    }

    // init _path
    this._path = this.getAttribute('path');

    // init _indent
    let indent = this.getAttribute('indent');
    if ( indent !== null ) {
      indent = parseInt(indent);
      this.$label.style.paddingLeft = indent * 13 + 'px';
    } else {
      indent = 0;
    }
    this._indent = indent;

    // init _folded
    this._folded = this.getAttribute('folded') !== null;

    // init movable
    if ( indent >= 1 && this.movable ) {
      this.$moveIcon.style.left = (indent-1) * 13 + 'px';
    }

    // init tooltip
    this.tooltip = this.getAttribute('tooltip');

    // update label
    this.$text.innerText = this._name;

    this._initFocusable(this);
    this._initDisable(true);
    this._initReadonly(true);
    this._initEvents();

    // expand prop element if we have type
    this._type = this.getAttribute('type');
    if ( this._type !== null ) {
      this.regen();
    }

    // HACK: any better idea? {
    // if user write prop in html, the children's createdCallback will be invoked after parent
    // so we can only use tagName and setAttribute since _propgateDisable/_propgateReadonly
    // will be failed in this phase

    // update disabled
    if ( this._disabled ) {
      DomUtils.walk(this, { excludeSelf: true }, el => {
        if ( el.tagName.indexOf('UI-') === 0 ) {
          el.setAttribute('is-disabled', '');
        }

        return false;
      });
    }

    // update readonly
    if ( this._readonly ) {
      DomUtils.walk(this, { excludeSelf: true }, el => {
        if ( el.tagName.indexOf('UI-') === 0 ) {
          el.setAttribute('is-readonly', '');
        }

        return false;
      });
    }
    // } HACK
  },

  attributeChangedCallback ( name, oldVal, newVal ) {
    if ( name === 'type' ) {
      this.type = newVal;
    } else if ( name === 'name' ) {
      this.name = newVal;
    } else if ( name === 'indent' ) {
      this.indent = newVal;
    } else if ( name === 'tooltip' ) {
      this.tooltip = newVal;
    }
  },

  fold () {
    if ( this._folded ) {
      return;
    }

    this._folded = true;
    this.$foldIcon.classList.remove('icon-fold-up');
    this.$foldIcon.classList.add('icon-fold');
    this.setAttribute('folded', '');
  },

  foldup () {
    if ( !this._folded ) {
      return;
    }

    this._folded = false;
    this.$foldIcon.classList.remove('icon-fold');
    this.$foldIcon.classList.add('icon-fold-up');
    this.removeAttribute('folded');
  },

  regen ( cb ) {
    ElementUtils.regenProperty(this, cb);
  },

  installStandardEvents (el) {
    if ( typeof this.inputValue !== 'function' ) {
      throw new Error('Invalid proto, inputValue is not defined.');
    }

    el.addEventListener('change', () => {
      this._value = this.inputValue();
      this._emitChange();
    });

    el.addEventListener('confirm', () => {
      this._value = this.inputValue();
      this._emitConfirm();
    });

    el.addEventListener('cancel', () => {
      this._value = this.inputValue();
      this._emitCancel();
    });
  },

  installSlideEvents (el, onChange, onConfirm, onCancel) {
    if ( !(el instanceof PropElement) ) {
      throw new Error('Invalid element, only <ui-prop> has slide events.');
    }

    if ( typeof this.inputValue !== 'function' ) {
      throw new Error('Invalid proto, inputValue is not defined.');
    }

    el.addEventListener('slide-start', () => {
      this._initValue = this.inputValue();
    });

    el.addEventListener('slide-change', event => {
      if ( onChange ) {
        onChange( event.detail.dx, event.detail.dy );
      }

      this._changed = true;
      this._value = this.inputValue();
      this._emitChange();
    });

    el.addEventListener('slide-confirm', () => {
      if ( !this._changed ) {
        return;
      }

      this._changed = false;
      this._value = this.inputValue();

      if ( onConfirm ) {
        onConfirm();
      }

      this._emitConfirm();
    });

    el.addEventListener('slide-cancel', () => {
      if ( !this._changed ) {
        return;
      }

      this._changed = false;
      this._value = this._initValue;

      if ( onCancel ) {
        onCancel();
      }

      this._emitCancel();
    });
  },

  _emitConfirm () {
    DomUtils.fire(this, 'confirm', {
      bubbles: false,
      detail: {
        path: this._path,
        value: this._value,
      },
    });
  },

  _emitCancel () {
    DomUtils.fire(this, 'cancel', {
      bubbles: false,
      detail: {
        path: this._path,
        value: this._value,
      },
    });
  },

  _emitChange () {
    DomUtils.fire(this, 'change', {
      bubbles: false,
      detail: {
        path: this._path,
        value: this._value,
      },
    });
  },

  // NOTE: override the focusable._getFirstFocusableElement
  _getFirstFocusableElement () {
    let el = FocusMgr._getFirstFocusableFrom(this,true);

    // do not focus on '.child'
    if ( el && el.parentElement && el.parentElement.classList.contains('child') ) {
      return null;
    }

    return el;
  },

  _initEvents () {
    this.addEventListener('focus-changed', event => {
      /**
       * NOTE:
       * A parent ui-prop must be selected if its structure is like this:
       * <ui-prop> # parent will recieve focus-changed event
       *   <ui-prop>A</ui-prop> # <== when we click on it
       *   <ui-prop>B</ui-prop>
       * </ui-prop>
       *
       * A parent ui-prop will not selected if children is in .child block
       * <ui-prop> # parent will *NOT* recieve focus-changed event
       *   <div class="child">
       *     <ui-prop>A</ui-prop> # <== when we click on it
       *     <ui-prop>B</ui-prop>
       *   </div>
       * </ui-prop>
       */
      if ( !(this.parentElement instanceof PropElement) ) {
        event.stopPropagation();
      }

      this.selected = event.detail.focused;

      // focus on first focusable child element if we focus on this and it is not disabled
      if ( !this.disabled && event.detail.focused && event.target === this ) {
        let focusableEL = this._getFirstFocusableElement();
        if ( focusableEL ) {
          FocusMgr._setFocusElement(focusableEL);
        }
      }
    });

    this.addEventListener('mouseover', event => {
      event.stopImmediatePropagation();
      this.hovering = true;
    });

    this.addEventListener('mouseout', event => {
      event.stopImmediatePropagation();
      this.hovering = false;
    });

    this.$label.addEventListener('mouseenter', () => {
      this._showTooltip();
    });

    this.$label.addEventListener('mouseleave', () => {
      this._hideTooltip();
    });

    this.$moveIcon.addEventListener('mouseenter', () => {
      this.style.backgroundColor = 'rgba(0,0,0,0.1)';
    });

    this.$moveIcon.addEventListener('mouseleave', () => {
      this.style.backgroundColor = '';
    });

    this.$removeIcon.addEventListener('mouseenter', () => {
      this.style.backgroundColor = 'rgba(255,0,0,0.3)';
      this.style.outline = '1px solid rgba(255,0,0,1)';
    });

    this.$removeIcon.addEventListener('mouseleave', () => {
      this.style.backgroundColor = '';
      this.style.outline = '';
    });

    this.addEventListener('mousedown', event => {
      DomUtils.acceptEvent(event);

      // NOTE: we cannot use 'point-event: none' in css, since _folded needs mousedown event
      if ( this.disabled ) {
        FocusMgr._setFocusElement(this);
        return;
      }

      // start drag
      if ( this.slidable ) {
        if ( this.readonly ) {
          DomUtils.startDrag('ew-resize', event);
        } else {
          this._sliding = true;

          DomUtils.fire(this, 'slide-start', {
            bubbles: false,
          });

          DomUtils.startDrag('ew-resize', event, event => {
            DomUtils.fire(this, 'slide-change', {
              bubbles: false,
              detail: {
                dx: event.movementX,
                dy: event.movementY,
              }
            });
          }, () => {
            DomUtils.fire(this, 'slide-confirm', {
              bubbles: false,
            });
          });
        }
      }

      // NOTE: this will make sure we can re-enter focus when click on label
      FocusMgr._setFocusElement(null);

      let focusableEL = this._getFirstFocusableElement();
      if ( focusableEL ) {
        FocusMgr._setFocusElement(focusableEL);
      } else {
        FocusMgr._setFocusElement(this);
      }
    });

    this.addEventListener('keydown', event => {
      // keydown 'enter'
      if (event.keyCode === 13) {
      }
      // keydown 'esc'
      else if (event.keyCode === 27) {
        if ( this._sliding ) {
          this._sliding = false;

          DomUtils.acceptEvent(event);
          DomUtils.cancelDrag();
          DomUtils.fire(this, 'slide-cancel', {
            bubbles: false,
          });
        }
      }
      // keydown 'left'
      else if (event.keyCode === 37) {
        DomUtils.acceptEvent(event);
        this.fold();
      }
      // keydown 'right'
      else if (event.keyCode === 39) {
        DomUtils.acceptEvent(event);
        this.foldup();
      }
    });

    this.$foldIcon.addEventListener('mousedown', () => {
      // NOTE: do not stopPropagation
      if ( this._folded ) {
        this.foldup();
      } else {
        this.fold();
      }
    });
  },

  _showTooltip () {
    if ( this.tooltip ) {
      if ( !_tooltipEL ) {
        _tooltipEL = new Hint(this._tooltip);
        _tooltipEL.style.display = 'none';
        _tooltipEL.style.position = 'absolute';
        _tooltipEL.style.maxWidth = '200px';
        _tooltipEL.style.zIndex = '999';
        _tooltipEL.classList = 'bottom shadow';
        _tooltipEL.position = '20px';

        document.body.appendChild(_tooltipEL);
      }
      _tooltipEL.innerText = this._tooltip;

      this._showTooltipID = setTimeout(() => {
        this._showTooltipID = null;

        _tooltipEL.style.display = 'block';

        let textRect = this.$text.getBoundingClientRect();
        let tooltipRect = _tooltipEL.getBoundingClientRect();

        _tooltipEL.style.left = textRect.left - 10;
        _tooltipEL.style.top = textRect.top - tooltipRect.height - 10;
      }, 200);
    }
  },

  _hideTooltip () {
    if ( this.tooltip ) {
      clearTimeout(this._showTooltipID);
      this._showTooltipID = null;

      if ( _tooltipEL )
      _tooltipEL.style.display = 'none';
    }
  },
});

module.exports = PropElement;
