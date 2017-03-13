'use strict';

const Path = require('fire-path');
const Fs = require('fire-fs');
const Globby = require('globby');
const Chalk = require('chalk');

function _logError (text) {
  console.log(Chalk.red(text));
}

module.exports = function (path, opts, cb) {
  let tap = require('../share/tap');

  tap.init(opts.reporter);
  tap.on('end', () => {
    cb(tap._fail);
  });

  global.tap = tap;
  global.helper = require('../share/helper');
  global.suite = tap.suite;

  // glob files
  let files = [];
  if ( Fs.isDirSync(path) ) {
    files = Globby.sync([
      Path.join(path,'**/*.js'),
      '!'+Path.join(path,'**/*.skip.js'),
      '!**/fixtures/**',
    ]);
  } else {
    files = [path];
  }

  files.forEach(file => {
    let fullpath = Path.resolve(file);
    try {
      require(fullpath);
    } catch (err) {
      _logError(`Failed to load spec: ${file}`);
    }
  });

  tap.end();
};
