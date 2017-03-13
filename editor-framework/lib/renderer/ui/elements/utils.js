'use strict';

/**
 * @module Editor.UI
 */

let Utils = {};
module.exports = Utils;

let _type2proto = {};

// requires
const Chroma = require('chroma-js');
const Console = require('../../console');
const JS = require('../../../share/js-utils');
const ResMgr = require('../utils/resource-mgr');
const DomUtils = require('../utils/dom-utils');

// NOTE
/**
 * Two notes about the custom constructor:
 *   1. The factoryImpl method is only invoked when you create an element using the constructor.
 *      The factoryImpl method is not called if the element is created from markup by the HTML parser,
 *      or if the element is created using document.createElement.
 *
 *   2. The factoryImpl method is called after the element is initialized
 *      (ready function invoked, local DOM created, default values set, and so on).
 */

// ==========================
// exports (register)
// ==========================

/**
 * @method registerElement
 * @param {String} name
 * @param {Object} def
 *
 * Register a custom element
 */
Utils.registerElement = function ( name, def ) {
  let template = def.template;
  let style = def.style;
  let listeners = def.listeners;
  let behaviors = def.behaviors;
  let selectors = def.$;
  let factoryImpl = def.factoryImpl;

  let module = function () {
    let el = document.createElement(name);

    if ( factoryImpl ) {
      factoryImpl.apply(el, arguments);
    }

    return el;
  };

  module.prototype = Object.create(HTMLElement.prototype);

  // TODO: dependencies

  // NOTE: do not use delete to change def, we need to reuse def since it was cached
  JS.assignExcept(module.prototype, def, [
    'dependencies', 'factoryImpl',
    'template', 'style', 'listeners', 'behaviors', '$'
  ]);

  // addon behaviors
  if ( behaviors ) {
    behaviors.forEach(be => {
      JS.addon(module.prototype, be);
    });
  }

  // constructor
  module.prototype.constructor = module;

  // created callback
  module.prototype.createdCallback = function () {
    let root = this.createShadowRoot();

    // instantiate template
    if ( template ) {
      root.innerHTML = template;
    }

    // insert style
    if ( style ) {
      let styleElement = document.createElement('style');
      styleElement.type = 'text/css';
      styleElement.textContent = style;

      root.insertBefore( styleElement, root.firstChild );
    }

    // update selector
    if ( selectors ) {
      for ( let name in selectors ) {
        if ( this[`$${name}`] ) {
          Console.warn(`failed to assign selector $${name}, already used`);
          continue;
        }

        this[`$${name}`] = root.querySelector(selectors[name]);
      }
    }

    // add event listeners
    if ( listeners ) {
      for ( let name in listeners ) {
        this.addEventListener(name, listeners[name].bind(this));
      }
    }

    // ready
    if ( this.ready ) {
      this.ready();
    }
  };

  Object.defineProperty(module, 'tagName', {
    get () { return name.toUpperCase(); },
  });

  // register element
  // NOTE: registerElement will return a constructor
  document.registerElement(name, module);

  return module;
};

/**
 * @method registerProperty
 * @param {String} type
 * @param {String|Object} protoOrUrl
 *
 * Register a custom property.
 */
Utils.registerProperty = function ( type, protoOrUrl ) {
  _type2proto[type] = protoOrUrl;
};

/**
 * @method unregisterProperty
 * @param {String} type
 *
 * Unregister a custom property.
 */
Utils.unregisterProperty = function ( type ) {
  delete _type2proto[type];
};

/**
 * @method getProperty
 * @param {String} type
 *
 * Get registered property via `type`
 */
Utils.getProperty = function ( type ) {
  return _type2proto[type];
};

/**
 * @method regenProperty
 * @param {HTMLElement} propEL
 * @param {Function} cb
 *
 * Regenerate property at `propEL`.
 */
Utils.regenProperty = function ( propEL, cb ) {
  let proto = _type2proto[propEL._type];
  if ( !proto ) {
    Console.warn(`Failed to regen property ${propEL._type}: type not registered.`);
    return;
  }

  // if file
  if ( typeof proto === 'string' ) {
    ResMgr.importScript(proto)
      .then(proto => {
        try {
          _doRegen(propEL, proto, cb);
        } catch (err) {
          // TODO: create error element
          Console.error(err.stack);

          if ( cb ) {
            cb (err);
          }
        }
      })
      .catch(err => {
        // TODO: create error element
        Console.error(err.stack);

        if ( cb ) {
          cb (err);
        }
      })
      ;

    return;
  }

  // else expand proto
  try {
    _doRegen(propEL, proto, cb);
  } catch (err) {
    // TODO: create error element
    Console.error(err.stack);

    if ( cb ) {
      cb (err);
    }
  }
};

// ==========================
// exports (parse)
// ==========================

/**
 * @method parseString
 * @param {String} txt
 *
 * Parse `txt` as a string.
 */
Utils.parseString = function (txt) { return txt; };

/**
 * @method parseBoolean
 * @param {String} txt
 *
 * Parse `txt` as a boolean value.
 */
Utils.parseBoolean = function (txt) {
  if ( txt === 'false' ) {
    return false;
  }
  return txt !== null;
};

/**
 * @method parseColor
 * @param {String} txt
 *
 * Parse `txt` as a color object.
 */
Utils.parseColor = function (txt) {
  return Chroma(txt).rgba();
};

/**
 * @method parseArray
 * @param {String} txt
 *
 * Parse `txt` as an array.
 */
Utils.parseArray = function (txt) {
  return JSON.parse(txt);
};

/**
 * @method parseObject
 * @param {String} txt
 *
 * Parse `txt` as an object.
 */
Utils.parseObject = function (txt) {
  return JSON.parse(txt);
};

// ==========================
// internal
// ==========================

function _doRegen ( propEL, proto, cb ) {
  let content;
  if ( proto.hasUserContent ) {
    let userContent = propEL.querySelector('.user-content');
    userContent = userContent || propEL;

    if ( userContent.children.length ) {
      content = [].slice.call( userContent.children, 0 );
    }
  }

  // clear propEL first
  DomUtils.clear(propEL);
  let customStyle = propEL.shadowRoot.getElementById('custom-style');
  if ( customStyle ) {
    customStyle.remove();
  }

  // assign
  JS.assignExcept(propEL, proto, [
    'template', 'style', 'attrs', 'value', 'hasUserContent',
  ]);

  // parse attrs
  if ( propEL._attrs === undefined ) {
    if ( proto.attrs ) {
      let attrs = {};
      for ( let name in proto.attrs ) {
        let attr = propEL.getAttribute(name);
        if ( attr !== null ) {
          let fn = proto.attrs[name];
          attrs[name] = fn(attr);
        }
      }

      propEL._attrs = attrs;
    }
  }

  // parse value
  if ( propEL._value === undefined ) {
    let valueAttr = propEL.getAttribute('value');
    if ( valueAttr !== null ) {
      propEL._value = proto.value(valueAttr);
    }
  }

  // expand template
  if ( proto.template ) {
    let type = typeof proto.template;
    if ( type === 'string' ) {
      propEL.innerHTML = proto.template;
    } else if ( type === 'function' ) {
      propEL.innerHTML = proto.template(propEL._attrs);
    }
  }

  // stash user-content
  if ( proto.hasUserContent && content ) {
    let userEL = document.createElement('div');
    userEL.classList = ['user-content'];

    content.forEach(el => {
      userEL.appendChild(el.cloneNode(true));
    });

    propEL.insertBefore(userEL, propEL.firstChild);
  }

  // expand style
  if ( proto.style ) {
    let styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.textContent = proto.style;
    styleElement.id = 'custom-style';

    propEL.shadowRoot.insertBefore(styleElement, propEL.shadowRoot.firstChild);
  }

  //
  propEL._propgateDisable();
  propEL._propgateReadonly();

  // ready
  if ( propEL.ready ) {
    propEL.ready(content);
  }

  // callback
  if (cb) {
    cb();
  }
}

// DISABLE
// function ui_prop ( name, value, type, attrs, indent ) {
//   let el = document.createElement('ui-prop');
//   el.name = name || '';
//   el.indent = indent || 0;
//   el._value = value;
//   el._attrs = attrs || {};
//   el._type = type || typeof value;

//   el.regen();

//   return el;
// }

// TODO: a default way for dumping value, example:
// [
//   { name: 'rotated', type: 'boolean', },
//   { name: 'offsetX', type: 'number', },
//   { name: 'offsetY', type: 'number', },
//   { name: 'trimType', type: 'enum', options: [
//     { name: 'Auto', value: 0 },
//     { name: 'Custom', value: 1 },
//   ]},
//   { name: 'trimX', type: 'number', },
//   { name: 'trimY', type: 'number', },
//   { displayName: 'Trim Width', name: 'width', type: 'number', },
//   { displayName: 'Trim Height', name: 'height', type: 'number', },
//   { name: 'borderTop', type: 'number', },
//   { name: 'borderBottom', type: 'number', },
//   { name: 'borderLeft', type: 'number', },
//   { name: 'borderRight', type: 'number', },
// ].forEach(info => {
//   let el;
//   let displayName = Editor.UI.toHumanText(info.name);

//   if ( info.type === 'object' ) {
//     el = new Editor.UI.Prop(
//       displayName, null, info.type, info.attrs, indent
//     );

//     if ( path ) {
//       el._path = `${path}.${info.name}`;
//     } else {
//       el._path = info.name;
//     }

//     parent.appendChild(el);
//     this.evaluate( el._childWrapper, indent + 1, info.name, info.value );
//   } else if ( info.type === 'enum' ) {
//     el = new Editor.UI.Prop(
//       displayName, info.value, info.type, info.attrs, indent
//     );

//     if ( path ) {
//       el._path = `${path}.${info.name}`;
//     } else {
//       el._path = info.name;
//     }

//     info.options.forEach(opt => {
//       el.addItem( opt.value, opt.name );
//     });
//     el.$input.value = info.value;

//     parent.appendChild(el);
//   } else {
//     el = new Editor.UI.Prop(
//       displayName, info.value, info.type, info.attrs, indent
//     );

//     if ( path ) {
//       el._path = `${path}.${info.name}`;
//     } else {
//       el._path = info.name;
//     }

//     parent.appendChild(el);
//   }
//   this.appendChild(el);
// });
