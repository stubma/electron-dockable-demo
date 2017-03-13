'use strict';

let PolymerUtils = {};
module.exports = PolymerUtils;

// requires
const DomUtils = require('./dom-utils');
const Console = require('../../console');
const i18n = require('../../i18n');

let _importCount = 0;

// ==========================
// exports
// ==========================

PolymerUtils.importing = false;

PolymerUtils.templatize = function ( parentEL, innerHTML, props ) {
  let tmpl = document.createElement('template');
  tmpl.innerHTML = innerHTML;

  // Prepare the template
  parentEL.templatize(tmpl);
  let instance = parentEL.stamp(props);

  return instance;
};

// binding helpers
PolymerUtils.bind = function ( el1, value1, el2, value2 ) {
  let camelValue2 = DomUtils.camelCase(value2);
  el1.addEventListener( value1+'-changed', function ( event ) {
    if ( event.detail.path ) {
      el2.set( event.detail.path, event.detail.value );
    } else {
      el2.set( camelValue2, event.detail.value );
    }
  });
  el2.addEventListener( value2+'-changed', function ( event ) {
    if ( event.detail.path ) {
      el1.set( event.detail.path, event.detail.value );
    } else {
      el1.set( value1, event.detail.value );
    }
  });
};

PolymerUtils.bindUUID = function ( el1, value1, el2, value2 ) {
  let camelValue2 = DomUtils.camelCase(value2);
  el1.addEventListener( value1+'-changed', function ( event ) {
    if ( event.detail.path === value1+'.uuid' ) {
      el2.set( camelValue2, event.detail.value );
    } else {
      if ( event.detail.value ) {
        el2.set( camelValue2, event.detail.value.uuid );
      } else {
        el2.set( camelValue2, null );
      }
    }
  });
  el2.addEventListener(value2+'-changed', function ( event ) {
    el1.set(value1, {
      uuid: event.detail.value
    });
  });
};

// parent operation
PolymerUtils.getSelfOrAncient = function ( element, parentType ) {
  let parent = element;
  while ( parent ) {
    if ( parent instanceof parentType ) {
      return parent;
    }

    parent = Polymer.dom(parent).parentNode;
  }

  return 0;
};

PolymerUtils.isSelfOrAncient = function ( element, ancientEL ) {
  let parent = element;
  while ( parent ) {
    if ( parent === ancientEL ) {
      return true;
    }

    parent = Polymer.dom(parent).parentNode;
  }

  return false;
};

//
PolymerUtils.import = function ( url, cb ) {
  ++_importCount;
  PolymerUtils.importing = true;

  Polymer.Base.importHref( url, function () {
    --_importCount;
    if ( _importCount === 0 ) {
      PolymerUtils.importing = false;
    }

    if ( cb ) cb ();
  }, function () {
    --_importCount;
    if ( _importCount === 0 ) {
      PolymerUtils.importing = false;
    }

    if ( cb ) {
      cb ( new Error(`${url} not found.`) );
    }
  });
};

PolymerUtils.registerElement = function ( obj ) {
  if ( !obj.is ) {
    let script = document.currentScript;
    let parent = script.parentElement;
    if ( parent && parent.tagName === 'DOM-MODULE' ) {
      obj.is = parent.id;
    } else {
      Console.error('Failed to register widget %s. The script must be inside a <dom-module> tag.');
      return;
    }
  }

  if ( !PolymerUtils.elements ) {
    PolymerUtils.elements = {};
  }

  if ( PolymerUtils.elements[obj.is] ) {
    Console.error('Failed to register widget %s since it already exists.', obj.is );
    return;
  }

  obj._T = function ( key, option ) {
    return i18n.t( key, option );
  };
  PolymerUtils.elements[obj.is] = Polymer(obj);
};

PolymerUtils.registerPanel = function ( panelID, obj ) {
  if ( !obj.is ) {
    let script = document.currentScript;
    let parent = script.parentElement;
    if ( parent && parent.tagName === 'DOM-MODULE' ) {
      obj.is = parent.id;
    } else {
      Console.error(`Failed to register panel ${panelID}, the script must be inside a <dom-module> tag.`);
      return;
    }
  }

  if ( !PolymerUtils.panels ) {
    PolymerUtils.panels = {};
  }

  if ( PolymerUtils.panels[panelID] !== undefined ) {
    Console.error(`Failed to register panel ${panelID}, that panelID has already been registered.`);
    return;
  }

  obj._T = function ( key, option ) {
    return i18n.t( key, option );
  };
  PolymerUtils.panels[panelID] = Polymer(obj);
};
