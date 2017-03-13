'use strict';

// const OS = require('os');
const Path = require('fire-path');
const Fs = require('fire-fs');
const Spawn = require('child_process').spawn;
const Async = require('async');
const Chalk = require('chalk');

const pjson = JSON.parse(Fs.readFileSync('./package.json'));
const electronVersion = pjson.devDependencies['electron'];

let cmdstr;
let env = process.env;
let arch;

if (process.platform === 'win32') {
  cmdstr = 'node-gyp.cmd';
  env.HOME = Path.join(env.HOMEPATH, '.electron-gyp');
  arch = 'ia32';
  // arch = OS.arch();
} else {
  cmdstr = 'node-gyp';
  env.HOME = Path.join(env.HOME, '.electron-gyp');
  // arch = OS.arch();
  arch = 'x64';
}

let nativePaths = _findNativeModulePathRecursive('./');
console.log(Chalk.blue('native modules:'));
nativePaths.forEach(path => {
  console.log(Chalk.blue(` - ${Path.basename(path)}`));
});

let count = nativePaths.length;
if (count === 0) {
  console.log('no native module found!');
  return;
}

Async.eachSeries(nativePaths, (path, done) => {
  console.log(Chalk.cyan('===================='));
  console.log(Chalk.cyan(`${Path.basename(path)}`));
  console.log(Chalk.cyan('====================\n'));

  let child = Spawn(cmdstr, [
    'rebuild',
    '--target='+electronVersion,
    '--arch='+arch,
    '--dist-url=https://atom.io/download/atom-shell'
  ], {
    stdio: 'inherit',
    env: env,
    cwd: path
  });
  child.on('exit', code => {
    if ( code !== 0 ) {
      console.log(Chalk.red(`\n${Path.basename(path)} failed!\n`));
    } else {
      console.log(Chalk.green(`\n${Path.basename(path)} success!\n`));
    }
    done();
  });
}, err => {
  if ( err ) {
    console.log(Chalk.red(err));
  }
});

function _findNativeModulePathRecursive(path) {
  var nativePaths = [];
  if ( Fs.existsSync(Path.join(path, 'binding.gyp')) ) {
    nativePaths.push(path);
  } else {
    if ( Fs.isDirSync(Path.join(path, 'node_modules')) ) {
      let subPaths = Fs.readdirSync(Path.join(path, 'node_modules'));
      subPaths.forEach(subpath => {
        let subCollect = _findNativeModulePathRecursive(Path.join(path, 'node_modules', subpath));
        if (subCollect.length > 0) {
          nativePaths = nativePaths.concat(subCollect);
        }
      });
    }
  }
  return nativePaths;
}
