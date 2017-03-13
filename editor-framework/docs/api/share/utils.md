# Editor.Utils

## Methods

### Editor.Utils.padLeft (text, width, ch)

  - `text` String
  - `width` Number
  - `ch` String - The character used to pad

### Editor.Utils.toFixed (value, precision, optionals)

  - `value` Number
  - `precision` Number
  - `optionals` Number

Implementation of toFixed() that treats floats more like decimals

Fixes binary rounding issues (eg. (0.615).toFixed(2) === '0.61') that present
problems for accounting- and finance-related software.

### Editor.Utils.formatFrame (frame, frameRate)

  - `frame` Number
  - `frameRate` Number

### Editor.Utils.smoothScale (curScale, delta)

  - `curScale` Number
  - `delta` Number

### Editor.Utils.wrapError (curScale, delta)

  - `err` Error

### Editor.Utils.arrayCmpFilter (items, func)

  - `items` Array
  - `func` Function

### Editor.Utils.fitSize (srcWidth, srcHeight, destWidth, destHeight)

  - `srcWidth` Number
  - `srcHeight` Number
  - `destWidth` Number
  - `destHeight` Number

### Editor.Utils.prettyBytes (num)

  - `num` Number

Convert bytes to a human readable string: 1337 → 1.34 kB. Reference: https://github.com/sindresorhus/pretty-bytes

### Editor.Utils.run (execFile, ...args)

  - `execFile` String
  - `...args` ...

run `execFile` with `args`.
