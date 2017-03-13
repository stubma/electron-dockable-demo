'use strict';

const Polyglot = require('node-polyglot');

let polyglot = new Polyglot();
let i18nReg = /^i18n:/;

// ==========================
// exports
// ==========================

// TODO: dynamically switch language:
// To achieve this:
//  - automatically load and replace language phrases
//  - automatically update menus
//  - automatically update panel and widget

// TODO: menu i18n solution

// TODO: panel can have i18n solution inside it,
//       so that panel load will register its i18n phrases to polyglot
//       panel unload will clear its i18n phrases
// P.S. the panel i18n translate could be _T(key) it will turn to Editor.T(`${panelID}`.key)

module.exports = {
  /**
   * @method format
   * @param {string} text
   *
   * Convert an i18n text `i18n:{id}` to string `{id}`
   */
  format ( text ) {
    if ( i18nReg.test(text) ) {
      return polyglot.t(text.substr(5));
    }

    return text;
  },

  /**
   * @method formatPath
   * @param {string} path
   *
   * Convert an i18n path `i18n:{id1}/i18n:{id2}` to string `{id1}/{id2}`.
   */
  formatPath ( path ) {
    let texts = path.split('/');

    texts = texts.map(text => {
      return this.format(text);
    });

    return texts.join('/');
  },

  /**
   * @method t
   * @param {string} key
   * @param {object} option
   *
   * Mapping an i18n id to translated text.
   */
  t ( key, option ) {
    return polyglot.t(key, option);
  },

  /**
   * @method extend
   * @param {object} phrases
   *
   * Extends the phrases
   */
  extend ( phrases ) {
    polyglot.extend(phrases);
  },

  /**
   * @method extend
   * @param {object} phrases
   *
   * Replaces exists phrases
   */
  replace ( phrases ) {
    polyglot.replace(phrases);
  },

  /**
   * @method unset
   * @param {object} phrases
   *
   * Removes phrases
   */
  unset ( phrases ) {
    polyglot.unset(phrases);
  },

  /**
   * @method clear
   *
   * Clear all phrases
   */
  clear () {
    polyglot.clear();
  },

  _phrases () {
    return polyglot.phrases;
  },

  /**
   * @property polyglot
   *
   * Get the polyglot instance
   */
  get polyglot () {
    return polyglot;
  }
};
