'use strict';

/**
 * @module PanelLoader
 */
let PanelLoader = {};
module.exports = PanelLoader;

// requires
const Console = require('./console');
const Path = require('fire-path');
const UI = require('./ui');
const JS = require('../share/js-utils');

// ==========================
// exports
// ==========================

function _createPanelFrame ( proto, useShadowDOM ) {
  let frameEL = document.createElement('ui-panel-frame');
  let template = proto.template;
  let style = proto.style;
  let listeners = proto.listeners;
  let behaviors = proto.behaviors;
  let selectors = proto.$;

  // NOTE: do not use delete to change proto, we need to reuse proto since it was cached
  JS.assignExcept(frameEL, proto, [
    'dependencies', 'template', 'style', 'listeners', 'behaviors', '$'
  ]);

  // addon behaviors
  if ( behaviors ) {
    behaviors.forEach(be => {
      JS.addon(frameEL, be);
    });
  }

  //
  if ( useShadowDOM ) {
    frameEL.createShadowRoot();
  }

  let root = frameEL.root;

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

  if ( useShadowDOM ) {
    root.insertBefore(
      UI.createStyleElement('theme://elements/panel-frame.css'),
      root.firstChild
    );
  }

  // update selector
  if ( selectors ) {
    for ( let name in selectors ) {
      if ( frameEL[`$${name}`] ) {
        Console.warn(`failed to assign selector $${name}, already used`);
        continue;
      }

      frameEL[`$${name}`] = root.querySelector(selectors[name]);
    }
  }

  // add event listeners
  if ( listeners ) {
    for ( let name in listeners ) {
      frameEL.addEventListener(name, listeners[name].bind(frameEL));
    }
  }

  return frameEL;
}

PanelLoader.load = function ( panelID, info, cb ) {
  let entryFile = Path.join( info.path, info.main );

  if ( !info.ui ) {
    UI.importScript(entryFile)
      .then(panelProto => {
        if ( !panelProto ) {
          throw new Error(`Failed to load panel ${panelID}: no panel proto return.`);
        }

        let useShadowDOM = info['shadow-dom'];

        // if we have dependencies, load them first then create the panel frame
        if ( panelProto.dependencies && panelProto.dependencies.length ) {
          UI.importScripts(panelProto.dependencies).then(() => {
            let frameEL = _createPanelFrame(panelProto, useShadowDOM);

            if ( cb ) {
              cb ( null, frameEL );
            }
          }).catch( err => {
            if ( cb ) {
              cb ( err );
            }
          });

          return;
        }

        // else, create the panel frame directly
        let frameEL = _createPanelFrame(panelProto, useShadowDOM);

        if ( cb ) {
          cb ( null, frameEL );
        }
      })
      .catch(err => {
        if ( cb ) {
          cb ( err );
        }
      });
  } else if ( info.ui === 'polymer' ) {
    UI.PolymerUtils.import( entryFile, ( err ) => {
      if ( err ) {
        if ( cb ) {
          cb ( new Error(`Failed to load panel ${panelID}: ${err.message}`) );
        }
        return;
      }

      let ctor = UI.PolymerUtils.panels[panelID];
      if ( !ctor ) {
        if ( cb ) {
          cb ( new Error(`Failed to load panel ${panelID}: Cannot find panel frame constructor in "UI.PolymerUtils.panels"`) );
        }
        return;
      }

      let frameEL = new ctor();
      frameEL.classList.add('fit');
      frameEL.tabIndex = 1;

      if ( cb ) {
        cb ( null, frameEL );
      }
    });
  }
};
