'use strict';

const DomUtils = require('../utils/dom-utils');

// readonly: the element is readonly by itself
// is-readonly: the element is readonly in hierarchy
// _setIsReadonlyAttribute: can be override by user to operate local elements

// ==========================
// exports
// ==========================

let Readonly = {
  get canBeReadonly () {
    return true;
  },

  /**
   * @property readonly
   * readonly only affect the presentation,
   * it doesn't influence _readonly at initialize phase,
   * use the attribute self-readonly to init _readonly if you create the element by html
   */
  get readonly () {
    return this.getAttribute('is-readonly') !== null;
  },
  set readonly (val) {
    if ( val !== this._readonly ) {
      this._readonly = val;

      // if readonly, go check and set readonly to all its children that can be readonly
      if ( val ) {
        this.setAttribute('readonly', '');
        this._setIsReadonlyAttribute(true);

        if ( !this._readonlyNested ) {
          return;
        }

        this._propgateReadonly();
      }
      // if enable, check if it is readonly in hierarchy
      // go check and remove readonly for all its children that can be readonly
      else {
        this.removeAttribute('readonly');

        if ( !this._isReadonlyInHierarchy(true) ) {
          this._setIsReadonlyAttribute(false);

          if ( !this._readonlyNested ) {
            return;
          }

          this._propgateReadonly();
        }
      }
    }
  },

  _initReadonly ( nested ) {
    // init _readonly (readonly)
    this._readonly = this.getAttribute('readonly') !== null;
    if ( this._readonly ) {
      this._setIsReadonlyAttribute(true);
    }
    this._readonlyNested = nested;
  },

  _propgateReadonly () {
    DomUtils.walk(this, { excludeSelf: true }, el => {
      if ( el.canBeReadonly ) {
        // if current element self readonly, skip it and don't bother its children
        if ( el._readonly ) {
          return true; // return true to skip children
        }

        el._setIsReadonlyAttribute(this._readonly);

        return !el._readonlyNested;
      }

      return false;
    });
  },

  _isReadonlyInHierarchy ( excludeSelf ) {
    if ( !excludeSelf && this.readonly ) {
      return true;
    }

    let parent = this.parentNode;
    while ( parent ) {
      if ( parent.readonly ) {
        return true;
      }

      parent = parent.parentNode;
    }

    return false;
  },

  _isReadonlySelf () {
    return this._readonly;
  },

  // NOTE: only invoke in readonly set function
  _setIsReadonlyAttribute ( readonly ) {
    if ( readonly ) {
      this.setAttribute('is-readonly', '');
    } else {
      this.removeAttribute('is-readonly');
    }
  },

};

module.exports = Readonly;
