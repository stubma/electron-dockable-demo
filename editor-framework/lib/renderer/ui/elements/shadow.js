'use strict';

const ElementUtils = require('./utils');

module.exports = ElementUtils.registerElement('ui-shadow', {
  style: `
    :host {
      display: block;
    }
  `,

  template: '',

  factoryImpl (content) {
    this.shadowRoot.innerHTML = content;
  },

  ready () {
    while ( this.childNodes.length ) {
      let el = this.childNodes[0];
      this.shadowRoot.appendChild(el);
    }
  },
});
