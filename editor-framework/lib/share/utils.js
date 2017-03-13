'use strict';

/**
 * @module Editor.Utils
 */
let EditorUtils = {
  /**
   * @method padLeft
   * @param {string} text
   * @param {number} width
   * @param {string} ch - the character used to pad
   * @return {string}
   */
  padLeft ( text, width, ch ) {
    text = text.toString();
    width -= text.length;
    if ( width > 0 ) {
      return new Array( width + 1 ).join(ch) + text;
    }
    return text;
  },

  /**
   * @method toFixed
   * @param {number} value
   * @param {number} precision
   * @param {number} optionals
   *
   * Implementation of toFixed() that treats floats more like decimals
   *
   * Fixes binary rounding issues (eg. (0.615).toFixed(2) === '0.61') that present
   * problems for accounting- and finance-related software.
   */
  toFixed (value, precision, optionals) {
    let power = Math.pow(10, precision);

    // Multiply up by precision, round accurately, then divide and use native toFixed():
    let output = (Math.round(value * power) / power).toFixed(precision);

    if (optionals) {
      let optionalsRegExp = new RegExp('0{1,' + optionals + '}$');
      output = output.replace(optionalsRegExp, '');

      // remove last child
      if ( optionals >= precision && output[output.length-1] === '.' ) {
        output = output.slice(0,-1);
      }
    }

    return output;
  },

  /**
   * @method formatFrame
   * @param {number} frame
   * @param {number} frameRate
   * @return {string}
   */
  formatFrame ( frame, frameRate ) {
    let decimals = Math.floor(Math.log10(frameRate))+1;
    let text = '';

    if ( frame < 0 ) {
      text = '-';
      frame = -frame;
    }

    return text +
      Math.floor(frame/frameRate) + ':' +
      EditorUtils.padLeft(frame % frameRate, decimals, '0');
  },

  /**
   * @method smoothScale
   * @param {number} curScale
   * @param {number} delta
   * @return {number}
   */
  smoothScale ( curScale, delta ) {
    let scale = curScale;
    scale = Math.pow( 2, delta * 0.002) * scale;

    return scale;
  },

  /**
   * @method wrapError
   * @param {Error} err
   *
   * Wrap error so that it can be sent between renderer and main process
   */
  wrapError ( err ) {
    return {
      message: err.message,
      stack: err.stack,
    };
  },

  /**
   * @method arrayCmpFilter
   * @param {Array} items
   * @param {Function} func
   */
  arrayCmpFilter ( items, func ) {
    let results = [];
    for ( let i = 0; i < items.length; ++i ) {
      let item = items[i];
      let add = true;

      for ( let j = 0; j < results.length; ++j ) {
        let addedItem = results[j];

        if ( item === addedItem ) {
          // existed
          add = false;
          break;
        }

        let cmp = func( addedItem, item );
        if ( cmp > 0 ) {
          add = false;
          break;
        } else if ( cmp < 0 ) {
          results.splice(j, 1);
          --j;
        }
      }

      if ( add ) {
        results.push(item);
      }
    }

    return results;
  },

  /**
   * @method fitSize
   * @param {number} srcWidth
   * @param {number} srcHeight
   * @param {number} destWidth
   * @param {number} destHeight
   * @return {number[]} - [width, height]
   */
  fitSize ( srcWidth, srcHeight, destWidth, destHeight ) {
    let width, height;

    if (
      srcWidth > destWidth &&
      srcHeight > destHeight
    ) {
      width = destWidth;
      height = srcHeight * destWidth/srcWidth;

      if ( height > destHeight ) {
        height = destHeight;
        width = srcWidth * destHeight/srcHeight;
      }

    } else if ( srcWidth > destWidth ) {
      width = destWidth;
      height = srcHeight * destWidth/srcWidth;

    } else if ( srcHeight > destHeight ) {
      width = srcWidth * destHeight/srcHeight;
      height = destHeight;

    } else {
      width = srcWidth;
      height = srcHeight;
    }

    return [width,height];
  },

  /**
   * @method prettyBytes
   * @param {number} num
   * @return {string}
   *
   * Convert bytes to a human readable string: 1337 → 1.34 kB
   * reference: https://github.com/sindresorhus/pretty-bytes
   */
  prettyBytes ( num ) {
    if (typeof num !== 'number' || Number.isNaN(num)) {
      throw new TypeError('Expected a number, got ' + typeof num);
    }

    let neg = num < 0;
    let units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    if (neg) {
      num = -num;
    }

    if (num < 1) {
      return (neg ? '-' : '') + num + ' B';
    }

    let exponent = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1);
    num = Number((num / Math.pow(1000, exponent)).toFixed(2));
    let unit = units[exponent];

    return `${neg ? '-' : ''}${num} ${unit}`;
  },

  /**
   * @method run
   * @param {string} execFile - The executable file
   * @param {...*} [args] - whatever arguments the `execFile` needs
   *
   * run `execFile` with `args`
   */
  run (execFile, ...args) {
    const Spawn = require('child_process').spawn;
    let cp = Spawn(execFile, args, {
      detached: true
    });
    cp.unref();
  }
};

module.exports = EditorUtils;
