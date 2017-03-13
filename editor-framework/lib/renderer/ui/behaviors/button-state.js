'use strict';

const DomUtils = require('../utils/dom-utils');
const FocusMgr = require('../utils/focus-mgr');

function _pressed ($el) {
  return $el.getAttribute('pressed') !== null;
}

// ==========================
// exports
// ==========================

let ButtonState = {
  _initButtonState ($el) {
    // process $el events
    DomUtils.installDownUpEvent($el);

    $el.addEventListener('keydown', event => {
      if ( this.disabled ) {
        return;
      }

      if ( event.keyCode === 32 /*space*/ ) {
        DomUtils.acceptEvent(event);

        this._setPressed($el, true);
        this._canceledByEsc = false;

      } else if ( event.keyCode === 13 /*enter*/ ) {
        DomUtils.acceptEvent(event);

        if ( this._enterTimeoutID ) {
          return;
        }

        this._setPressed($el, true);
        this._canceledByEsc = false;

        this._enterTimeoutID = setTimeout(() => {
          this._enterTimeoutID = null;
          this._setPressed($el, false);
          $el.click();
        },100);

      } else if ( event.keyCode === 27 /*esc*/ ) {
        DomUtils.acceptEvent(event);

        if ( _pressed($el) ) {
          DomUtils.fire($el, 'cancel', { bubbles: false });
          this._canceledByEsc = true;
        }
        this._setPressed($el, false);
      }
    });
    $el.addEventListener('keyup', event => {
      if ( event.keyCode === 32 /*space*/ ) {
        DomUtils.acceptEvent(event);

        if ( _pressed($el) ) {
          // async-click
          setTimeout(() => {
            $el.click();
          },1);
        }
        this._setPressed($el, false);
      }
    });
    $el.addEventListener('down', event => {
      DomUtils.acceptEvent(event);

      FocusMgr._setFocusElement(this);
      this._setPressed($el, true);
      this._canceledByEsc = false;
    });
    $el.addEventListener('up', event => {
      DomUtils.acceptEvent(event);

      this._setPressed($el, false);
    });
    $el.addEventListener('click', event => {
      if ( this.readonly ) {
        return;
      }

      if ( this._canceledByEsc ) {
        this._canceledByEsc = false;
        DomUtils.acceptEvent(event);
        return;
      }

      this._onButtonClick($el);
    });
    $el.addEventListener('focus-changed', () => {
      if ( !this.focused ) {
        this._setPressed($el, false);
      }
    });
  },

  _setPressed ($el, val) {
    if (val) {
      $el.setAttribute('pressed', '');
    } else {
      $el.removeAttribute('pressed');
    }
  },
};

module.exports = ButtonState;
