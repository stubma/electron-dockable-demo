'use strict';

const JS = require('../../../share/js-utils');
const Tab = require('./tab');
const Droppable = require('../behaviors/droppable');
const DockUtils = require('../utils/dock-utils');
const DomUtils = require('../utils/dom-utils');
const FocusMgr = require('../utils/focus-mgr');

// ==========================
// exports
// ==========================

class Tabs extends window.HTMLElement {
  static get tagName () { return 'UI-DOCK-TABS'; }

  createdCallback () {
    let root = this.createShadowRoot();
    root.innerHTML = `
      <div class="border">
        <div class="tabs">
          <content select="ui-dock-tab"></content>
        </div>

        <div id="popup" class="icon" on-click="_onPopup">
          <i class="icon-popup"></i>
        </div>
        <div id="menu" class="icon" on-click="_onMenuPopup">
          <i class="icon-menu"></i>
        </div>
        <div id="insertLine" class="insert"></div>
      </div>
    `;
    root.insertBefore(
      DomUtils.createStyleElement('theme://elements/tabs.css'),
      root.firstChild
    );

    // init
    this.activeTab = null;
    this._focused = false;

    // query element
    this.$ = {
      popup: this.shadowRoot.querySelector('#popup'),
      menu: this.shadowRoot.querySelector('#menu'),
      insertLine: this.shadowRoot.querySelector('#insertLine'),
    };

    // init events
    this.addEventListener('mousedown', event => { event.preventDefault(); });
    this.addEventListener('click', this._onClick.bind(this));
    this.addEventListener('tab-click', this._onTabClick.bind(this));
    this.addEventListener('drop-area-enter', this._onDropAreaEnter.bind(this));
    this.addEventListener('drop-area-leave', this._onDropAreaLeave.bind(this));
    this.addEventListener('drop-area-accept', this._onDropAreaAccept.bind(this));
    this.addEventListener('dragover', this._onDragOver.bind(this));
    this.$.popup.addEventListener('click', this._onPopup.bind(this));
    this.$.menu.addEventListener('click', this._onMenuPopup.bind(this));

    // init droppable
    this.droppable = 'tab';
    this.singleDrop = true;
    this._initDroppable(this);

    if ( this.children.length > 0 ) {
      this.select(this.children[0]);
    }
  }

  _setFocused ( focused ) {
    this._focused = focused;

    for ( let i = 0; i < this.children.length; ++i ) {
      let tabEL = this.children[i];
      tabEL.focused = focused;
    }
  }

  findTab ( frameEL ) {
    for ( let i = 0; i < this.children.length; ++i ) {
      let tabEL = this.children[i];
      if ( tabEL.frameEL === frameEL ) {
        return tabEL;
      }
    }

    return null;
  }

  insertTab ( tabEL, insertBeforeTabEL ) {
    // do nothing if we insert to ourself
    if ( tabEL === insertBeforeTabEL ) {
      return tabEL;
    }

    if ( insertBeforeTabEL ) {
      this.insertBefore(tabEL, insertBeforeTabEL);
    } else {
      this.appendChild(tabEL);
    }
    tabEL.focused = this._focused;

    return tabEL;
  }

  addTab ( name ) {
    let tabEL = document.createElement('ui-dock-tab');
    tabEL.name = name;

    this.appendChild(tabEL);
    tabEL.focused = this._focused;

    return tabEL;
  }

  removeTab ( tab ) {
    let tabEL = null;
    if ( typeof tab === 'number' ) {
      if ( tab < this.children.length ) {
        tabEL = this.children[tab];
      }
    } else if ( tab.tagName === Tab.tagName ) {
      tabEL = tab;
    }

    //
    if ( tabEL !== null ) {
      if ( this.activeTab === tabEL ) {
        this.activeTab = null;

        let nextTab = tabEL.nextElementSibling;
        if ( !nextTab ) {
          nextTab = tabEL.previousElementSibling;
        }

        if ( nextTab ) {
          this.select(nextTab);
        }
      }

      tabEL.focused = false;
      this.removeChild(tabEL);
    }
  }

  select ( tab ) {
    let tabEL = null;

    if ( typeof tab === 'number' ) {
      if ( tab < this.children.length ) {
        tabEL = this.children[tab];
      }
    } else if ( tab.tagName === Tab.tagName ) {
      tabEL = tab;
    }

    //
    if ( tabEL !== null ) {
      if ( tabEL !== this.activeTab ) {
        let oldTabEL = this.activeTab;

        if ( this.activeTab !== null ) {
          this.activeTab.classList.remove('active');
        }
        this.activeTab = tabEL;
        this.activeTab.classList.add('active');

        let panelID = tabEL.frameEL.getAttribute('id');
        let pagePanelInfo = Editor.Panel.getPanelInfo(panelID);
        if ( pagePanelInfo ) {
          this.$.popup.classList.toggle('hide', !pagePanelInfo.popable);
        }

        DomUtils.fire( this, 'tab-changed', {
          bubbles: true,
          detail: {
            oldTab: oldTabEL,
            newTab: tabEL
          }
        });
      }

      // NOTE: focus should after tab-changed, which will change the display style for panel frame
      FocusMgr._setFocusPanelFrame(tabEL.frameEL);
    }
  }

  outOfDate ( tab ) {
    let tabEL = null;

    if ( typeof tab === 'number' ) {
      if ( tab < this.children.length ) {
        tabEL = this.children[tab];
      }
    } else if ( tab.tagName === Tab.tagName ) {
      tabEL = tab;
    }

    //
    if ( tabEL !== null ) {
      tabEL.outOfDate = true;
    }
  }

  _onClick ( event ) {
    event.stopPropagation();
    FocusMgr._setFocusPanelFrame(this.activeTab.frameEL);
  }

  _onTabClick ( event ) {
    event.stopPropagation();
    this.select(event.target);
  }

  _onDropAreaEnter ( event ) {
    event.stopPropagation();
  }

  _onDropAreaLeave ( event ) {
    event.stopPropagation();

    this.$.insertLine.style.display = '';
  }

  _onDropAreaAccept ( event ) {
    event.stopPropagation();

    DockUtils.dropTab(this, this._curInsertTab);
    this.$.insertLine.style.display = '';
  }

  _onDragOver ( event ) {
    // NOTE: in web, there is a problem:
    // http://stackoverflow.com/questions/11974077/datatransfer-setdata-of-dragdrop-doesnt-work-in-chrome
    let type = event.dataTransfer.getData('editor/type');
    if ( type !== 'tab' ) {
      return;
    }

    DockUtils.dragoverTab( this );

    //
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';

    let eventTarget = event.target;

    //
    this._curInsertTab = null;
    let style = this.$.insertLine.style;
    style.display = 'block';
    if ( eventTarget.tagName === Tab.tagName ) {
      style.left = eventTarget.offsetLeft + 'px';
      this._curInsertTab = eventTarget;
    } else {
      let el = this.lastElementChild;
      style.left = (el.offsetLeft + el.offsetWidth) + 'px';
    }
  }

  _onPopup ( event ) {
    event.stopPropagation();

    if ( this.activeTab ) {
      let panelID = this.activeTab.frameEL.getAttribute('id','');
      Editor.Panel.popup(panelID);
    }
  }

  _onMenuPopup ( event ) {
    event.stopPropagation();

    let rect = this.$.menu.getBoundingClientRect();
    let panelID = '';
    if ( this.activeTab ) {
      panelID = this.activeTab.frameEL.getAttribute('id','');
    }

    let panelInfo = Editor.Panel.getPanelInfo(panelID);
    let popable = true;
    if ( panelInfo ) {
      popable = panelInfo.popable;
    }

    Editor.Menu.popup([
      { label: Editor.T('PANEL_MENU.maximize'), dev: true, message: 'editor:panel-maximize', params: [panelID] },
      { label: Editor.T('PANEL_MENU.pop_out'), message: 'editor:panel-popup', enabled: popable, params: [panelID] },
      { label: Editor.T('PANEL_MENU.close'), command: 'Editor.Panel.close', params: [panelID] },
      { label: Editor.T('PANEL_MENU.add_tab'), dev:true, submenu: [
      ]},
    ], rect.left + 5, rect.bottom + 5);
  }
}

JS.addon(Tabs.prototype, Droppable);

module.exports = Tabs;

