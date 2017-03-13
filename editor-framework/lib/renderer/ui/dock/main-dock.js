'use strict';

// requires
const DockUtils = require('../utils/dock-utils');
const FocusMgr = require('../utils/focus-mgr');

// ==========================
// exports
// ==========================

class MainDock extends window.HTMLElement {
  static get tagName () { return 'UI-MAIN-DOCK'; }

  createdCallback () {
    this.style.cssText = `
      position: relative;
    `;
    this.innerHTML = `
      <ui-dock id="root" class="fit" no-collapse></ui-dock>
    `;
  }

  attachedCallback () {
    window.requestAnimationFrame(() => {
      DockUtils.root = this.querySelector('#root');
      DockUtils.loadLayout(DockUtils.root.parentNode, needReset => {
        if ( needReset ) {
          DockUtils.reset();
        }
        FocusMgr._setFocusPanelFrame(null);
      });
    });
  }
}

module.exports = MainDock;
