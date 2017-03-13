'use strict';

const Hljs = require('highlight.js');
const Remarkable = require('remarkable');

const ElementUtils = require('./utils');
const ResMgr = require('../utils/resource-mgr');
const Console = require('../../console');

module.exports = ElementUtils.registerElement('ui-markdown', {
  /**
   * @property value
   */
  get value () {
    return this._value;
  },
  set value (val) {
    if (this._value !== val) {
      this._value = val;
      this._render();
    }
  },

  template: `
    <div class="container"></div>
  `,

  style: ResMgr.getResource('theme://elements/markdown.css'),

  $: {
    container: '.container',
  },

  factoryImpl (text) {
    if ( text ) {
      this.value = text;
    }
  },

  ready () {
    // TODO: src, if we have src, ignore textContent
    // let text = Fs.readFileSync( this.path, {encoding: 'utf-8'} );

    this.value = this._unindent(this.textContent);

    // TODO: MutationObserver for characterData
  },

  _render () {
    let md = new Remarkable({
      html: true,
      highlight ( str, lang ) {
        if (lang && Hljs.getLanguage(lang)) {
          try {
            return Hljs.highlight(lang, str).value;
          } catch (err) {
            Console.error(`Syntax highlight failed: ${err.message}` );
          }
        }

        try {
          return Hljs.highlightAuto(str).value;
        } catch (err) {
          Console.error(`Syntax highlight failed: ${err.message}` );
        }

        return ''; // use external default escaping
      }
    });
    let result = md.render(this.value);

    // DISABLE:
    // Marked.setOptions({
    //   highlight (code) {
    //     return Hljs.highlightAuto(code).value;
    //   }
    // });
    // let result = Marked( this.value );

    this.$container.innerHTML = result;
  },

  _unindent (text) {
    if (!text) {
      return text;
    }

    let lines  = text.replace(/\t/g, '  ').split('\n');
    let indent = lines.reduce((prev, line) => {
      // Completely ignore blank lines.
      if (/^\s*$/.test(line)) {
        return prev;
      }

      let lineIndent = line.match(/^(\s*)/)[0].length;
      if (prev === null) {
        return lineIndent;
      }

      return lineIndent < prev ? lineIndent : prev;
    }, null);

    return lines.map(l => { return l.substr(indent); }).join('\n');
  }
});
