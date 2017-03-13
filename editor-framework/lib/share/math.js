'use strict';

/**
 * @module Editor.Math
 */

const _d2r = Math.PI / 180.0;
const _r2d = 180.0 / Math.PI;

const PI = Math.PI;
const TWO_PI =  2.0 * Math.PI;
const HALF_PI = 0.5 * Math.PI;

const EPSILON = 1e-12;
const MACHINE_EPSILON = 1.12e-16;

let sqrt = Math.sqrt;
let pow = Math.pow;
let cos = Math.cos;
let acos = Math.acos;
let max = Math.max;

// ==========================
// exports
// ==========================

/**
 * [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math)
 */
let _Math = {

  /**
   * @property {number} EPSILON
   */
  EPSILON: EPSILON,

  /**
   * @property {number} MACHINE_EPSILON
   */
  MACHINE_EPSILON: MACHINE_EPSILON,

  /**
   * @property {number} TWO_PI - Two Pi
   */
  TWO_PI: TWO_PI,

  /**
   * @property {number} HALF_PI - Half Pi
   */
  HALF_PI: HALF_PI,

  /**
   * @property {number} D2R - degree to radius
   */
  D2R: _d2r,

  /**
   * @property {number} R2D - radius to degree
   */
  R2D: _r2d,

  /**
   * @method deg2rad
   * @param {number} degree
   * @return {number} radius
   *
   * degree to radius
   */
  deg2rad ( degree ) {
    return degree * _d2r;
  },

  /**
   * @method rad2deg
   * @param {number} radius
   * @return {number} degree
   *
   * Radius to degree
   */
  rad2deg ( radius ) {
    return radius * _r2d;
  },

  /**
   * @method rad180
   * @param {number} radius
   * @return {number} clamped radius
   *
   * Let radius in -pi to pi
   */
  rad180 ( radius ) {
    if ( radius > Math.PI || radius < -Math.PI ) {
      radius = (radius + _Math.TOW_PI) % _Math.TOW_PI;
    }
    return radius;
  },

  /**
   * @method rad360
   * @param {number} radius
   * @return {number} clamped radius
   *
   * Let radius in 0 to 2pi
   */
  rad360 ( radius ) {
    if ( radius > _Math.TWO_PI ) {
      return radius % _Math.TOW_PI;
    } else if ( radius < 0.0 ) {
      return _Math.TOW_PI + radius % _Math.TOW_PI;
    }

    return radius;
  },

  /**
   * @method deg180
   * @param {number} degree
   * @return {number} clamped degree
   *
   * Let degree in -180 to 180
   */
  deg180 ( degree ) {
    if ( degree > 180.0 || degree < -180.0 ) {
      degree = (degree + 360.0) % 360.0;
    }
    return degree;
  },

  /**
   * @method deg360
   * @param {number} degree
   * @return {number} clamped degree
   *
   * Let degree in 0 to 360
   */
  deg360 ( degree ) {
    if ( degree > 360.0 ) {
      return degree % 360.0;
    } else if ( degree < 0.0 ) {
      return 360.0 + degree % 360.0;
    }
    return degree;
  },

  /**
   * @method randomRange
   * @param {number} min
   * @param {number} max
   * @return {number} the random number
   *
   * Returns a random floating-point number between min (inclusive) and max (exclusive).
   */
  randomRange (min, max) {
    return Math.random() * (max - min) + min;
  },

  /**
   * @method randomRangeInt
   * @param {number} min
   * @param {number} max
   * @return {number} the random integer
   *
   * Returns a random integer between min (inclusive) and max (exclusive).
   */
  randomRangeInt (min, max) {
    return Math.floor(_Math.randomRange(min, max));
  },

  /**
   * @method clamp
   * @param {number} val
   * @param {number} min
   * @param {number} max
   * @return {number}
   *
   * Clamps a value between a minimum float and maximum float value.
   */
  clamp: _clamp,

  /**
   * @method clamp01
   * @param {number} val
   * @return {number}
   *
   * Clamps a value between 0 and 1.
   */
  clamp01 ( val ) {
    return val < 0 ? 0 : val > 1 ? 1 : val;
  },

  /**
   * @method calculateMaxRect
   * @param {Rect} out
   * @param {Vec2} p0
   * @param {Vec2} p1
   * @param {Vec2} p2
   * @param {Vec2} p3
   * @return {Rect} just the out rect itself
   */
  calculateMaxRect (out, p0, p1, p2, p3) {
    let minX = Math.min(p0.x, p1.x, p2.x, p3.x);
    let maxX = Math.max(p0.x, p1.x, p2.x, p3.x);
    let minY = Math.min(p0.y, p1.y, p2.y, p3.y);
    let maxY = Math.max(p0.y, p1.y, p2.y, p3.y);

    out.x = minX;
    out.y = minY;
    out.width = maxX - minX;
    out.height = maxY - minY;

    return out;
  },

  /**
   * @method lerp
   * @param {number} from
   * @param {number} to
   * @param {number} ratio - the interpolation coefficient
   * @return {number}
   */
  lerp (from, to, ratio) {
    return from + (to - from) * ratio;
  },

  /**
   * @method numOfDecimals
   *
   * Get number of decimals for decimal part
   */
  numOfDecimals (val) {
    return _Math.clamp(Math.floor( Math.log10(val) ), 0, 20);
  },

  /**
   * @method numOfDecimalsF
   *
   * Get number of decimals for fractional part
   */
  numOfDecimalsF (val) {
    return _Math.clamp(-Math.floor( Math.log10(val) ), 0, 20);
  },

  /**
   * @method toPrecision
   */
  toPrecision (val, precision) {
    precision = _Math.clamp(precision, 0, 20);
    return parseFloat(val.toFixed(precision));
  },

  /**
   * @method bezier
   * @param {number} c0
   * @param {number} c1
   * @param {number} c2
   * @param {number} c3
   * @param {number} t - the ratio
   */
  // Reference:
  // - http://devmag.org.za/2011/04/05/bzier-curves-a-tutorial/
  // - http://devmag.org.za/2011/06/23/bzier-path-algorithms/
  // - http://pomax.github.io/bezierinfo/
  bezier (c0, c1, c2, c3, t) {
    let t1 = 1 - t;
    return c0 * t1 * t1 * t1 +
           c1 * 3 * t1 * t1 * t +
           c2 * 3 * t1 * t * t +
           c3 * t * t * t;
  },

  /**
   * @method solveCubicBezier
   * @param {number} c0
   * @param {number} c1
   * @param {number} c2
   * @param {number} c3
   * @param {number} x
   */
  solveCubicBezier (c0, c1, c2, c3, x) {
    let len = c3 - c0;
    x = (x - c0) / len;

    let p0 = x - 0;
    let p1 = x - (c1-c0) / len;
    let p2 = x - (c2-c0) / len;
    let p3 = x - 1;

    return _cardano( p0, p1, p2, p3 );
  },

};

module.exports = _Math;

// ==========================
// Internal
// ==========================

function _clamp ( val, min, max ) {
  return val < min ? min : val > max ? max : val;
}

// A real-cuberoots-only function:
function _crt (v) {
  if (v < 0) {
    return -pow(-v,1/3);
  }
  return pow(v,1/3);
}

// The origin Cardano's algorithm is based on:
// http://www.trans4mind.com/personal_development/mathematics/polynomials/cubicAlgebra.htm
function _cardano ( pa, pb, pc, pd ) {
  let d = (-pa + 3*pb - 3*pc + pd),
      a = (3*pa - 6*pb + 3*pc) / d,
      b = (-3*pa + 3*pb) / d,
      c = pa / d;

  let p = (3*b - a*a)/3,
      p3 = p/3,
      q = (2*a*a*a - 9*a*b + 27*c)/27,
      q2 = q/2,
      discriminant = q2*q2 + p3*p3*p3;

  // and some variables we're going to use later on:
  let u1,v1,root1,root2,root3;

  // three possible real roots:
  if (discriminant < 0) {
    let mp3  = -p/3,
        mp33 = mp3*mp3*mp3,
        r    = sqrt( mp33 ),
        t    = -q / (2*r),
        cosphi = t<-1 ? -1 : t>1 ? 1 : t,
        phi  = acos(cosphi),
        crtr = _crt(r),
        t1   = 2*crtr;

    root1 = t1 * cos(phi/3) - a/3;
    root2 = t1 * cos((phi+2*PI)/3) - a/3;
    root3 = t1 * cos((phi+4*PI)/3) - a/3;

    // choose best percentage
    // function accept(t) { return 0<=t && t <=1; }
    // [root1, root2, root3].filter(accept);
    if (0 <= root1 && root1 <= 1) {
      if (0 <= root2 && root2 <= 1) {
        if (0 <= root3 && root3 <= 1) {
          return max(root1, root2, root3);
        } else {
          return max(root1, root2);
        }
      } else if (0 <= root3 && root3 <= 1) {
        return max(root1, root3);
      } else {
        return root1;
      }
    } else {
      if (0 <= root2 && root2 <= 1) {
        if (0 <= root3 && root3 <= 1) {
          return max(root2, root3);
        } else {
          return root2;
        }
      } else {
        return root3;
      }
    }
  }
  // three real roots, but two of them are equal:
  else if (discriminant === 0) {
    u1 = q2 < 0 ? _crt(-q2) : -_crt(q2);
    root1 = 2*u1 - a/3;
    root2 = -u1 - a/3;

    // choose best percentage
    // function accept(t) { return 0<=t && t <=1; }
    // [root1, root2].filter(accept);
    if (0 <= root1 && root1 <= 1) {
      if (0 <= root2 && root2 <= 1) {
        return max(root1, root2);
      } else {
        return root1;
      }
    } else {
      return root2;
    }
  }
  // one real root, two complex roots
  else {
    let sd = sqrt(discriminant);
    u1 = _crt(sd - q2);
    v1 = _crt(sd + q2);
    root1 = u1 - v1 - a/3;

    return root1;
  }
}
