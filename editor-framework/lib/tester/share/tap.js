process.env.TAP_COLORS = 1;
process.env.TAP_USE_TTY = 1;

let tap = require('tap');
let tapMochaReporter = require('tap-mocha-reporter');

tap.init = function ( reporter ) {
  tap.unpipe(process.stdout);
  tap.pipe(tapMochaReporter(reporter));
};

tap.Test.prototype.addAssert('approx', 3, function (found, wanted, maxDifferent, message, extra ) {
  let diff = Math.abs(found - wanted);

  maxDifferent = maxDifferent || 0.0001;
  message = message || `should be approximate (${maxDifferent})`;

  if ( diff <= maxDifferent ) {
    return this.pass(message, extra);
  }

  extra.found = found;
  extra.wanted = wanted;
  extra.compare = '~=';

  return this.fail(message, extra);
});

tap.Test.prototype.addAssert('notApprox', 3, function (found, wanted, maxDifferent, message, extra ) {
  let diff = Math.abs(found - wanted);

  maxDifferent = maxDifferent || 0.0001;
  message = message || `should be not approximate (${maxDifferent})`;

  if ( diff > maxDifferent ) {
    return this.pass(message, extra);
  }

  extra.found = found;
  extra.wanted = wanted;
  extra.compare = '!~=';

  return this.fail(message, extra);
});

tap.suite = function (t, msg, opts, fn ) {
  if ( !(t instanceof tap.Test) ) {
    throw new TypeError('Expected tap.Test instance, got ' + typeof t);
  }

  if ( typeof msg !== 'string' ) {
    throw new TypeError('Expected string, got ' + typeof msg);
  }

  if ( typeof opts === 'function' ) {
    fn = opts;
  }

  let _opts;
  if ( typeof opts === 'object' ) {
    _opts = opts;
    if ( _opts.autoend === undefined ) {
      _opts.autoend = true;
    }
    if ( _opts.timeout === undefined ) {
      _opts.timeout = 0; // infinite
    }
  } else {
    _opts = { autoend: true, timeout: 0 };
  }

  return t.test( msg, _opts, fn );
};

module.exports = tap;
