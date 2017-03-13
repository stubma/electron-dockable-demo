'use strict';

// ==========================
// exports
// ==========================

function _getParentTabIndex ( element ) {
  let parent = element.parentElement;
  while ( parent ) {
    if (
      parent.tabIndex !== null &&
      parent.tabIndex !== undefined &&
      parent.tabIndex !== -1
    ) {
      return parent.tabIndex;
    }

    parent = parent.parentElement;
  }

  return 0;
}

let PolymerFocusable = {
  'ui-focusable': true,

  properties: {
    focused: {
      type: Boolean,
      value: false,
      notify: true,
      readOnly: true,
      reflectToAttribute: true,
    },

    disabled: {
      type: Boolean,
      value: false,
      notify: true,
      observer: '_disabledChanged',
      reflectToAttribute: true,
    },

    noNavigate: {
      type: Boolean,
      value: false,
      reflectToAttribute: true,
    },
  },

  _initFocusable: function ( focusEls ) {
    if ( focusEls ) {
      if ( Array.isArray(focusEls) ) {
        this.focusEls = focusEls;
      }
      else {
        this.focusEls = [focusEls];
      }
    }
    else {
      this.focusEls = [];
    }

    this._initTabIndex();
    this._losingFocus = false;
  },

  _initTabIndex () {
    if ( !this.focusEls )
      return;

    var el, i;

    if ( this.noNavigate || this.disabled ) {
      for ( i = 0; i < this.focusEls.length; ++i ) {
        el = this.focusEls[i];
        el.tabIndex = -1;
      }
    }
    else {
      for ( i = 0; i < this.focusEls.length; ++i ) {
        el = this.focusEls[i];
        el.tabIndex = _getParentTabIndex(this) + 1;
      }
    }
  },

  _removeTabIndex () {
    if ( !this.focusEls )
      return;

    for ( var i = 0; i < this.focusEls.length; ++i ) {
      var el = this.focusEls[i];
      el.tabIndex = -1;
    }
  },

  _disabledInHierarchy () {
    if ( this.disabled )
      return true;

    var parent = Polymer.dom(this).parentNode;
    while ( parent ) {
      if ( parent.disabled )
        return true;

      parent = Polymer.dom(parent).parentNode;
    }
    return false;
  },

  _focusedChanged () {
    if ( this.disabled ) {
      this._setFocused(false);
    }
  },

  _disabledChanged ( disabled ) {
    if ( disabled ) {
      this.style.pointerEvents = 'none';
      _removeTabIndexRecursively(this);
    }
    else {
      this.style.pointerEvents = '';
      _initTabIndexRecursively(this);
    }
  },

  // _onFocusIn ( event ) {
  //     this._setFocused(true);
  // },

  // _onFocusOut ( event ) {
  //     this._setFocused(false);
  // },

  // NOTE: do not overwrite these events, instead listen to 'on-focused-changed'

  _onFocus () {
    // DISABLE
    // this._losingFocus = false;

    this._setFocused(true);
  },

  _onBlur () {
    // DISABLE
    // this._losingFocus = true;
    // this.async(function () {
    //     if ( this._losingFocus ) {
    //         this._setFocused(false);
    //     }
    // }.bind(this),1);

    this._setFocused(false);
  },

  setFocus () {
    if ( this._disabledInHierarchy() )
      return;

    if ( this.focusEls.length > 0 ) {
      this.focusEls[0].focus();
    }
    this._setFocused(true);
  },

  setBlur () {
    if ( this._disabledInHierarchy() )
      return;

    if ( this.focusEls.length > 0 ) {
      this.focusEls[0].blur();
    }
    this._setFocused(false);
  },
};

module.exports = PolymerFocusable;

// ==========================
// Internal
// ==========================

// REF: http://webaim.org/techniques/keyboard/tabindex
//
function _removeTabIndexRecursively ( el ) {
  if ( el.focused !== undefined && el._initTabIndex !== undefined ) {
    el._setFocused(false);
    el._removeTabIndex();
  }

  var elementDOM = Polymer.dom(el);
  for ( var i = 0; i < elementDOM.children.length; ++i ) {
    _removeTabIndexRecursively ( elementDOM.children[i] );
  }
}

function _initTabIndexRecursively ( el ) {
  if ( el.focused !== undefined && el._initTabIndex !== undefined ) {
    if ( el.disabled === false ) {
      el._initTabIndex();
    }
  }

  var elementDOM = Polymer.dom(el);
  for ( var i = 0; i < elementDOM.children.length; ++i ) {
    _initTabIndexRecursively ( elementDOM.children[i] );
  }
}

