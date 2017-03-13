'use strict';

const DomUtils = require('../utils/dom-utils');
const FocusMgr = require('../utils/focus-mgr');

// ==========================
// exports
// ==========================

let InputState = {
  _initInputState ( $input ) {
    if ( !this._onInputConfirm ) {
      throw new Error('Failed to init input-state: please implement _onInputConfirm');
    }
    if ( !this._onInputCancel ) {
      throw new Error('Failed to init input-state: please implement _onInputCancel');
    }
    if ( !this._onInputChange ) {
      throw new Error('Failed to init input-state: please implement _onInputChange');
    }

    let isTextArea = $input instanceof HTMLTextAreaElement;

    $input._initValue = $input.value;
    $input._focused = false;
    $input._selectAllWhenMouseUp = false;
    $input._mouseStartX = -1;

    // process $input events
    $input.addEventListener('focus', () => {
      $input._focused = true;
      $input._initValue = $input.value;

      // if we are not focus by mouse
      if ( $input._selectAllWhenMouseUp === false ) {
        $input.select();
      }
    });
    $input.addEventListener('blur', () => {
      $input._focused = false;
    });
    $input.addEventListener('change', event => {
      DomUtils.acceptEvent(event);
      this._onInputConfirm($input);
    });
    // NOTE: polymer can only listen to non-bubble event
    $input.addEventListener('input', event => {
      DomUtils.acceptEvent(event);
      this._onInputChange($input);
    });
    $input.addEventListener('keydown', event => {
      if ( this.disabled ) {
        return;
      }

      // NOTE: this can prevent input key event propagate
      event.stopPropagation();

      // keydown 'enter'
      if (event.keyCode === 13) {
        // if text-area, we need ctrl/cmd + enter to perform confirm
        if ( !isTextArea || (event.ctrlKey || event.metaKey) ) {
          DomUtils.acceptEvent(event);
          this._onInputConfirm($input,true);
        }
      }
      // keydown 'esc'
      else if (event.keyCode === 27) {
        DomUtils.acceptEvent(event);
        this._onInputCancel($input,true);
      }
    });
    $input.addEventListener('keyup', event => {
      // NOTE: this can prevent input key event propagate
      event.stopPropagation();
    });
    $input.addEventListener('keypress', event => {
      // NOTE: this can prevent input key event propagate
      event.stopPropagation();
    });
    $input.addEventListener('mousedown', event => {
      event.stopPropagation();
      FocusMgr._setFocusElement(this);

      $input._mouseStartX = event.clientX;
      if ( !$input._focused ) {
        $input._selectAllWhenMouseUp = true;
      }
    });
    $input.addEventListener('mouseup', event => {
      event.stopPropagation();

      if ( $input._selectAllWhenMouseUp ) {
        $input._selectAllWhenMouseUp = false;

        // if we drag select, don't do anything
        if ( Math.abs(event.clientX - $input._mouseStartX) < 4 ) {
          $input.select();
        }
      }
    });
  },

  _unselect ($input) {
    $input.selectionStart = $input.selectionEnd = -1;
  }
};

module.exports = InputState;
