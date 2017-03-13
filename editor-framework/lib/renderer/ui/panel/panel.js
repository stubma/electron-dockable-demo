'use strict';

const JS = require('../../../share/js-utils');
const DockUtils = require('../utils/dock-utils');
const DomUtils = require('../utils/dom-utils');
const FocusMgr = require('../utils/focus-mgr');
const Resizable = require('../behaviors/resizable');
const Dockable = require('../behaviors/dockable');

// ==========================
// exports
// ==========================

class DockPanel extends window.HTMLElement {
  static get tagName () { return 'UI-DOCK-PANEL'; }

  /**
   * @property focusable
   */
  get focusable () {
    return true;
  }

  /**
   * @property focused
   */
  get focused () {
    return this.getAttribute('focused') !== null;
  }

  /**
   * @property activeTab
   */
  get activeTab () {
    return this.$.tabs.activeTab;
  }

  /**
   * @property activeIndex
   */
  get activeIndex () {
    return DomUtils.index(this.$.tabs.activeTab);
  }

  /**
   * @property tabCount
   */
  get tabCount () {
    return this.$.tabs.children.length;
  }

  createdCallback () {
    let root = this.createShadowRoot();
    root.innerHTML = `
      <ui-dock-tabs id="tabs"></ui-dock-tabs>
      <div class="border">
        <div class="frame-wrapper">
          <content></content>
        </div>
      </div>
    `;
    root.insertBefore(
      DomUtils.createStyleElement('theme://elements/panel.css'),
      root.firstChild
    );

    this.tabIndex = -1;

    if ( this.width === null ) { this.width = 200; }
    if ( this.height === null ) { this.height = 200; }
    if ( this.minWidth === null ) { this.minWidth = 200; }
    if ( this.minHeight === null ) { this.minHeight = 200; }

    // query element
    this.$ = {
      tabs: this.shadowRoot.querySelector('#tabs'),
    };

    // init behaviors
    this._initDockable();
    this._initResizable();

    //
    this._initTabs();

    //
    this.addEventListener('focusin', this._onFocusIn.bind(this));
    this.$.tabs.addEventListener('tab-changed', this._onTabChanged.bind(this));

    // NOTE: we do this in capture phase to make sure it has the highest priority
    this.addEventListener('keydown', event => {
      // 'command+shift+]' || 'ctrl+tab'
      if (
        (event.shiftKey && event.metaKey && event.keyCode === 221) ||
        (event.ctrlKey && event.keyCode === 9)
      ) {
        event.stopPropagation();

        let next = this.activeIndex+1;
        if ( next >= this.tabCount ) {
          next = 0;
        }

        this.select(next);
        return;
      }

      // 'command+shift+[' || 'ctrl+shift+tab'
      if (
        (event.shiftKey && event.metaKey && event.keyCode === 219) ||
        (event.ctrlKey && event.shiftKey && event.keyCode === 9)
      ) {
        event.stopPropagation();

        let prev = this.activeIndex-1;
        if ( prev < 0 ) {
          prev = this.tabCount-1;
        }

        this.select(prev);
        return;
      }
    }, true);

    // grab mousedown in capture phase to make sure we focus on it
    this.addEventListener('mousedown', event => {
      if ( event.which === 1 ) {
        FocusMgr._setFocusPanelFrame(this.activeTab.frameEL);
      }
    }, true);

    // if no one process mousedown event, we should blur focused element
    this.addEventListener('mousedown', event => {
      event.stopPropagation();

      if ( event.which === 1 ) {
        FocusMgr._setFocusElement(null);
      }
    });
  }

  _getFirstFocusableElement () {
    return this;
  }

  // NOTE: only invoked by FocusMgr
  _setFocused ( focused ) {
    this.$.tabs._setFocused(focused);

    if ( focused ) {
      this.setAttribute('focused', '');
    } else {
      this.removeAttribute('focused');
    }
  }

  _onMouseDown ( event ) {
    if ( event.which === 1 ) {
      event.stopPropagation();
      FocusMgr._setFocusPanelFrame(this.activeTab.frameEL);
    }
  }

  _onFocusIn () {
    FocusMgr._setFocusPanelFrame(this.activeTab.frameEL);
  }

  _onTabChanged ( event ) {
    event.stopPropagation();

    let detail = event.detail;
    if ( detail.oldTab !== null ) {
      detail.oldTab.frameEL.style.display = 'none';
      DomUtils.fire(detail.oldTab.frameEL, 'panel-hide');
    }

    if ( detail.newTab !== null ) {
      detail.newTab.frameEL.style.display = '';
      DomUtils.fire(detail.newTab.frameEL, 'panel-show');
    }

    DockUtils.saveLayout();
  }

  _initTabs () {
    //
    let tabs = this.$.tabs;
    tabs.panelEL = this;

    //
    for ( let i = 0; i < this.children.length; ++i ) {
      let el = this.children[i];

      //
      let name = el.getAttribute('name');
      let tabEL = tabs.addTab(name);
      tabEL.setAttribute('draggable', 'true');

      el.style.display = 'none';
      tabEL.frameEL = el;
      tabEL.setIcon( el.icon );
    }

    tabs.select(0);
  }

  _collapseRecursively () {
    this.collapse();
  }

  _finalizeSizeRecursively ( reset ) {
    this._applyFrameSize(reset);
  }

  _finalizeMinMaxRecursively () {
    this._applyFrameMinMax();
  }

  _finalizeStyleRecursively () {
    this._applyStyle();
  }

  _applyFrameSize ( reset ) {
    let autoWidth = false;
    let autoHeight = false;

    // reset width, height
    this.computedWidth = this.width;
    this.computedHeight = this.height;

    for ( let i = 0; i < this.children.length; ++i ) {
      let el = this.children[i];

      // width
      let elWidth = DockUtils.getFrameSize( el, 'width' );
      if ( autoWidth || elWidth === 'auto' ) {
        autoWidth = true;
        this.computedWidth = 'auto';
      } else {
        if ( this.width === 'auto' || elWidth > this.computedWidth ) {
          this.computedWidth = elWidth;
        }
      }

      // height
      let elHeight = DockUtils.getFrameSize( el, 'height' );
      if ( autoHeight || elHeight === 'auto' ) {
        autoHeight = true;
        this.computedHeight = 'auto';
      } else {
        if ( this.height === 'auto' || elHeight > this.computedHeight ) {
          this.computedHeight = elHeight;
        }
      }
    }

    if ( reset ) {
      this.curWidth = this.computedWidth;
      this.curHeight = this.computedHeight;
    }
    // if reset is false, we just reset the part that
    else {
      if ( this.parentNode.row ) {
        this.curHeight = this.computedHeight;
      } else {
        this.curWidth = this.computedWidth;
      }
    }
  }

  _applyFrameMinMax () {
    let infWidth = false;
    let infHeight = false;

    for ( let i = 0; i < this.children.length; ++i ) {
      let el = this.children[i];

      // NOTE: parseInt('auto') will return NaN, it will return false in if check

      // min-width
      let minWidth = parseInt(el.getAttribute('min-width'));
      if ( minWidth ) {
        if ( this.minWidth === 'auto' || minWidth > this.minWidth ) {
          this.computedMinWidth = minWidth;
        }
      }

      // min-height
      let minHeight = parseInt(el.getAttribute('min-height'));
      if ( minHeight ) {
        if ( this.minHeight === 'auto' || minHeight > this.minHeight ) {
          this.computedMinHeight = minHeight;
        }
      }

      // max-width
      let maxWidth = parseInt(el.getAttribute('max-width'));
      maxWidth = isNaN(maxWidth) ? 'auto' : maxWidth;
      if ( infWidth || maxWidth === 'auto' ) {
        infWidth = true;
        this.computedMaxWidth = 'auto';
      } else {
        if ( this.maxWidth === 'auto' ) {
          infWidth = true;
        } else if ( maxWidth && maxWidth > this.maxWidth ) {
          this.computedMaxWidth = maxWidth;
        }
      }

      // max-height
      let maxHeight = parseInt(el.getAttribute('max-height'));
      maxHeight = isNaN(maxHeight) ? 'auto' : maxHeight;
      if ( infHeight || maxHeight === 'auto' ) {
        infHeight = true;
        this.computedMaxHeight = 'auto';
      } else {
        if ( this.maxHeight === 'auto' ) {
          infHeight = true;
        } else if ( maxHeight && maxHeight > this.maxHeight ) {
          this.computedMaxHeight = maxHeight;
        }
      }
    }
  }

  _applyStyle () {
    // min-width
    if ( this.computedMinWidth !== 'auto' ) {
      this.style.minWidth = this.computedMinWidth + 'px';
    } else {
      this.style.minWidth = 'auto';
    }

    // max-width
    if ( this.computedMaxWidth !== 'auto' ) {
      this.style.maxWidth = this.computedMaxWidth + 'px';
    } else {
      this.style.maxWidth = 'auto';
    }

    // min-height
    if ( this.computedMinHeight !== 'auto' ) {
      this.style.minHeight = this.computedMinHeight + 'px';
    } else {
      this.style.minHeight = 'auto';
    }

    // max-height
    if ( this.computedMaxHeight !== 'auto' ) {
      this.style.maxHeight = this.computedMaxHeight + 'px';
    } else {
      this.style.maxHeight = 'auto';
    }
  }

  outOfDate ( idxOrFrameEL ) {
    let tabs = this.$.tabs;

    if ( typeof idxOrFrameEL === 'number' ) {
      tabs.outOfDate(idxOrFrameEL);
    } else {
      for ( let i = 0; i < this.children.length; ++i ) {
        if ( idxOrFrameEL === this.children[i] ) {
          tabs.outOfDate(i);
          break;
        }
      }
    }
  }

  select ( idxOrFrameEL ) {
    let tabs = this.$.tabs;

    if ( typeof idxOrFrameEL === 'number' ) {
      tabs.select(idxOrFrameEL);
    } else {
      for ( let i = 0; i < this.children.length; ++i ) {
        if ( idxOrFrameEL === this.children[i] ) {
          tabs.select(i);
          break;
        }
      }
    }
  }

  insert ( tabEL, frameEL, insertBeforeTabEL ) {
    let tabs = this.$.tabs;

    // let name = frameEL.getAttribute('name');
    tabs.insertTab(tabEL, insertBeforeTabEL);
    tabEL.setAttribute('draggable', 'true');

    // NOTE: if we just move tabs, we must not hide frameEL
    if ( tabEL.parentNode !== tabs ) {
      frameEL.style.display = 'none';
    }
    tabEL.frameEL = frameEL;
    tabEL.setIcon( frameEL.icon );

    //
    if ( insertBeforeTabEL ) {
      if ( frameEL !== insertBeforeTabEL.frameEL ) {
        this.insertBefore(frameEL, insertBeforeTabEL.frameEL);
      }
    } else {
      this.appendChild(frameEL);
    }

    //
    this._applyFrameMinMax();
    this._applyStyle();

    return DomUtils.index(tabEL);
  }

  add ( frameEL ) {
    let tabs = this.$.tabs;
    let name = frameEL.getAttribute('name');
    let tabEL = tabs.addTab(name);

    tabEL.setAttribute('draggable', 'true');

    frameEL.style.display = 'none';
    tabEL.frameEL = frameEL;
    tabEL.setIcon( frameEL.icon );

    this.appendChild(frameEL);

    //
    this._applyFrameMinMax();
    this._applyStyle();

    //
    return this.children.length - 1;
  }

  closeNoCollapse ( tabEL ) {
    let tabs = this.$.tabs;

    //
    tabs.removeTab(tabEL);
    if ( tabEL.frameEL ) {
      let panelEL = tabEL.frameEL.parentNode;
      panelEL.removeChild(tabEL.frameEL);
      tabEL.frameEL = null;
    }

    //
    this._applyFrameMinMax();
    this._applyStyle();
  }

  close ( tabEL ) {
    this.closeNoCollapse(tabEL);
    this.collapse();
  }

  // override Editor.UI.Resizable._notifyResize()
  _notifyResize () {
    DomUtils.fire(this, 'resize');

    // dispatch 'resize' event for all panel-frame no matter if they are actived
    for ( let i = 0; i < this.children.length; ++i ) {
      let frameEL = this.children[i];
      DomUtils.fire(frameEL, 'panel-resize');
    }
  }

  // override Dockable.collapse
  collapse () {
    // remove from dock;
    if ( this.$.tabs.children.length === 0 ) {
      if ( this.parentNode._dockable ) {
        return this.parentNode.removeDock(this);
      }
    }

    return false;
  }

  // override Dockable._reflowRecursively
  _reflowRecursively () {
  }
}

JS.addon(DockPanel.prototype, Resizable, Dockable);

module.exports = DockPanel;
