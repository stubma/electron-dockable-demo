'use strict';

const ElementUtils = require('./utils');
const DomUtils = require('../utils/dom-utils');
const FocusMgr = require('../utils/focus-mgr');
const ResMgr = require('../utils/resource-mgr');
const Focusable = require('../behaviors/focusable');
const Disable = require('../behaviors/disable');

module.exports = ElementUtils.registerElement('ui-section', {
  /**
   * @property hovering
   */
  get hovering () {
    return this.getAttribute('hovering') !== null;
  },
  set hovering (val) {
    if (val) {
      this.setAttribute('hovering', '');
    } else {
      this.removeAttribute('hovering');
    }
  },

  behaviors: [ Focusable, Disable ],

  template: `
    <div class="wrapper">
      <i class="fold icon-fold-up"></i>
      <content select=".header"></content>
    </div>
    <content select=":not(.header)"></content>
  `,

  style: ResMgr.getResource('theme://elements/section.css'),

  $: {
    wrapper: '.wrapper',
    foldIcon: '.fold',
  },

  factoryImpl (text) {
    let labelText = document.createElement('span');
    labelText.innerText = text;
    this.appendChild(labelText);
  },

  ready () {
    // init _folded
    this._folded = this.getAttribute('folded') !== null;

    this._initFocusable(this.$wrapper);
    this._initDisable(true);

    //
    this._initEvents();
  },

  _initEvents () {
    this.addEventListener('mousedown', event => {
      DomUtils.acceptEvent(event);
      FocusMgr._setFocusElement(this);
    });

    this.$wrapper.addEventListener('mousedown', () => {
      // NOTE: do not stopPropagation, section needs mousedown event to focus
      if ( this._folded ) {
        this.foldup();
      } else {
        this.fold();
      }
    });

    // DISABLE
    // this.$foldIcon.addEventListener('mousedown', () => {
    //   // NOTE: do not stopPropagation, section needs mousedown event to focus
    //   if ( this._folded ) {
    //     this.foldup();
    //   } else {
    //     this.fold();
    //   }
    // });

    this.$wrapper.addEventListener('mouseover', event => {
      event.stopImmediatePropagation();
      this.hovering = true;
    });

    this.$wrapper.addEventListener('mouseout', event => {
      event.stopImmediatePropagation();
      this.hovering = false;
    });

    this.$wrapper.addEventListener('keydown', event => {
      // keydown 'left'
      if (event.keyCode === 37) {
        DomUtils.acceptEvent(event);
        this.fold();
      }
      // keydown 'right'
      else if (event.keyCode === 39) {
        DomUtils.acceptEvent(event);
        this.foldup();
      }
    });
  },

  fold () {
    if ( this._folded ) {
      return;
    }

    this._folded = true;
    this.$foldIcon.classList.remove('icon-fold-up');
    this.$foldIcon.classList.add('icon-fold');
    this.setAttribute('folded', '');
  },

  foldup () {
    if ( !this._folded ) {
      return;
    }

    this._folded = false;
    this.$foldIcon.classList.remove('icon-fold');
    this.$foldIcon.classList.add('icon-fold-up');
    this.removeAttribute('folded');
  },
});
