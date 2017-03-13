'use strict';

const DomUtils = require('../utils/dom-utils');

// disabled: the element is disabled by itself
// is-disabled: the element is disabled in hierarchy
// _setIsDisabledAttribute: can be override by user to operate local elements

// ==========================
// exports
// ==========================

let Disable = {
  get canBeDisable () {
    return true;
  },

  /**
   * @property disabled
   * disabled only affect the presentation,
   * it doesn't influence _disabled at initialize phase,
   * use the attribute self-disabled to init _disabled if you create the element by html
   */
  get disabled () {
    return this.getAttribute('is-disabled') !== null;
  },
  set disabled (val) {
    if ( val !== this._disabled ) {
      this._disabled = val;

      // if disabled, go check and set disabled to all its children that can be disabled
      if ( val ) {
        this.setAttribute('disabled', '');
        this._setIsDisabledAttribute(true);

        if ( !this._disabledNested ) {
          return;
        }

        this._propgateDisable();
      }
      // if enable, check if it is disabled in hierarchy
      // go check and remove disabled for all its children that can be disabled
      else {
        this.removeAttribute('disabled');

        if ( !this._isDisabledInHierarchy(true) ) {
          this._setIsDisabledAttribute(false);

          if ( !this._disabledNested ) {
            return;
          }

          this._propgateDisable();
        }
      }
    }
  },

  _initDisable ( nested ) {
    // init _disabled (disabled)
    this._disabled = this.getAttribute('disabled') !== null;
    if ( this._disabled ) {
      this._setIsDisabledAttribute(true);
    }
    this._disabledNested = nested;
  },

  _propgateDisable () {
    DomUtils.walk(this, { excludeSelf: true }, el => {
      if ( el.canBeDisable ) {
        // if current element self disabled, skip it and don't bother its children
        if ( el._disabled ) {
          return true; // return true to skip children
        }

        el._setIsDisabledAttribute(this._disabled);

        return !el._disabledNested;
      }

      return false;
    });
  },

  _isDisabledInHierarchy ( excludeSelf ) {
    if ( !excludeSelf && this.disabled ) {
      return true;
    }

    let parent = this.parentNode;
    while ( parent ) {
      if ( parent.disabled ) {
        return true;
      }

      parent = parent.parentNode;
    }

    return false;
  },

  _isDisabledSelf () {
    return this._disabled;
  },

  // NOTE: only invoke in disabled set function
  _setIsDisabledAttribute ( disabled ) {
    if ( disabled ) {
      this.setAttribute('is-disabled', '');
    } else {
      this.removeAttribute('is-disabled');
    }
  },

};

module.exports = Disable;
