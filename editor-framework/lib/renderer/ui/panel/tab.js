'use strict';

const DockUtils = require('../utils/dock-utils');
const DomUtils = require('../utils/dom-utils');

// ==========================
// exports
// ==========================

class Tab extends window.HTMLElement {
  static get tagName () { return 'UI-DOCK-TAB'; }

  createdCallback () {
    let root = this.createShadowRoot();
    root.innerHTML = `
      <div class="border">
        <div class="inner">
          <div class="title">
            <div id="icon"></div>
            <span id="name"></span>
          </div>
        </div>
      </div>
    `;
    root.insertBefore(
      DomUtils.createStyleElement('theme://elements/tab.css'),
      root.firstChild
    );

    this.addEventListener( 'mousedown', event => { event.stopPropagation(); } );
    this.addEventListener( 'dragstart', this._onDragStart.bind(this) );
    this.addEventListener( 'click', this._onClick.bind(this) );

    this.$ = {
      name: this.shadowRoot.querySelector('#name'),
      icon: this.shadowRoot.querySelector('#icon'),
    };
    this.frameEL = null;

    this.setIcon(null);
  }

  get name () {
    return this.$.name.innerText;
  }
  set name (val) {
    this.$.name.innerText = val;
  }

  get outOfDate () {
    return this.getAttribute('out-of-date') !== null;
  }
  set outOfDate (val) {
    if (val) {
      this.setAttribute('out-of-date', '');
    } else {
      this.removeAttribute('out-of-date');
    }
  }

  get focused () {
    return this.getAttribute('focused') !== null;
  }
  set focused (val) {
    if (val) {
      this.setAttribute('focused', '');
    } else {
      this.removeAttribute('focused');
    }
  }

  _onDragStart ( event ) {
    event.stopPropagation();

    DockUtils.dragstart( event.dataTransfer, this );
  }

  _onClick ( event ) {
    event.stopPropagation();

    DomUtils.fire(this, 'tab-click', {
      bubbles: true
    });
  }

  // NOTE: there is a bug on css:hover for tab,
  // when we drop tab 'foo' on top of tab 'bar' to insert before it,
  // the tab 'bar' will keep css:hover state after.
  // _onMouseEnter: function ( event ) {
  //     this.classList.add('hover');
  // },

  // _onMouseLeave: function ( event ) {
  //     this.classList.remove('hover');
  // },

  setIcon ( img ) {
    let iconEL = this.$.icon;

    if ( img ) {
      iconEL.style.display = 'inline';
      if ( iconEL.children.length ) {
        iconEL.removeChild(iconEL.firstChild);
      }
      iconEL.appendChild(img);
      // NOTE: this will prevent icon been dragged
      img.setAttribute( 'draggable', 'false' );

      return;
    }

    iconEL.style.display = 'none';
    if ( iconEL.children.length ) {
      iconEL.removeChild(iconEL.firstChild);
    }
  }
}

module.exports = Tab;
