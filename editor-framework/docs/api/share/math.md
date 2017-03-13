# Editor.Math

## Properties

### Editor.Math.EPSILON

### Editor.Math.MACHINE_EPSILON

### Editor.Math.TWO_PI

### Editor.Math.HALF_PI

### Editor.Math.D2R

### Editor.Math.R2D

## Methods

### Editor.Math.deg2rad (degree)

  - `degree` Number

Degree to radius.

### Editor.Math.rad2deg (radius)

  - `radius` Number

Radius to degree.

### Editor.Math.rad180 (radius)

  - `radius` Number

Let radius in -pi to pi.

### Editor.Math.rad360 (radius)

  - `radius` Number

Let radius in 0 to 2pi.

### Editor.Math.deg180 (degree)

  - `degree` Number

Let degree in -180 to 180.

### Editor.Math.deg360 (degree)

  - `degree` Number

Let degree in 0 to 360.

### Editor.Math.randomRange (min, max)

  - `min` Number
  - `max` Number

Returns a random floating-point number between min (inclusive) and max (exclusive).

### Editor.Math.randomRangeInt (min, max)

  - `min` Number
  - `max` Number

Returns a random integer between min (inclusive) and max (exclusive).

### Editor.Math.clamp (val, min, max)

  - `val` Number
  - `min` Number
  - `max` Number

Clamps a value between a minimum float and maximum float value.

### Editor.Math.clamp01 (val)

  - `val` Number

Clamps a value between 0 and 1.

### Editor.Math.calculateMaxRect (out, p0, p1, p2, p3)

  - `out` Rect
  - `p0` Vec2
  - `p1` Vec2
  - `p2` Vec2
  - `p3` Vec2

### Editor.Math.lerp (from, to, ratio)

  - `from` Number
  - `to` Number
  - `ratio` Number

### Editor.Math.numOfDecimals (val)

  - `val` Number

Get number of decimals for decimal part.

### Editor.Math.numOfDecimalsF (val)

  - `val` Number

Get number of decimals for fractional part.

### Editor.Math.toPrecision (val, precision)

  - `val` Number
  - `precision` Number

### Editor.Math.bezier (c0, c1, c2, c3, t)

  - `c0` Number
  - `c1` Number
  - `c2` Number
  - `c3` Number
  - `t` Number

### Editor.Math.solveCubicBezier (c0, c1, c2, c3, x)

  - `c0` Number
  - `c1` Number
  - `c2` Number
  - `c3` Number
  - `x` Number
