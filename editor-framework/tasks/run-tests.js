'use strict';

const path = require('path');
const chalk = require('chalk');
const async = require('async');

const electron = require('electron');
const globby = require('globby');
const spawn = require('child_process').spawn;

// ==========================
// run single file
// ==========================

const yargs = require('yargs');
yargs.options({
  'renderer': { type: 'boolean', desc: 'Run tests in renderer.' },
  'package': { type: 'boolean', desc: 'Run specific package tests.' },
  'detail': { type: 'boolean', desc: 'Run test in debug mode (It will not quit the test, and open the devtools to help you debug it).' },
  'reporter': { type: 'string', desc: 'Mocha reporter, default is \'spec\'' },
});

let yargv = yargs.argv;
if ( yargv._.length ) {
  let file = yargv._[0];

  let args = ['./test', 'test', file];

  // renderer
  if ( yargv.renderer ) {
    args.push('--renderer');
  }

  // package
  if ( yargv.package ) {
    args.push('--package');
  }

  // detail
  if ( yargv.detail ) {
    args.push('--detail');
  }

  // reporter
  args.push('--reporter');
  if ( yargv.reporter ) {
    args.push(yargv.reporter);
  } else {
    args.push('spec');
  }

  spawn(electron, args, {
    stdio: 'inherit',
  });

  return;
}

// ==========================
// run all tests
// ==========================

// get cwd
let cwd = process.cwd();

// get main files
let mainTests = globby.sync([
  'main/**/*.js', 'share/**/*.js', '!**/*.skip.js'
], { cwd: './test', realpath: true });

// get renderer files
let rendererTests = globby.sync([
  'renderer/**/*.js', 'share/**/*.js', '!**/*.skip.js'
], { cwd: './test', realpath: true });

// process tests
let failedTests = [];
async.eachSeries([
  { files: mainTests, renderer: false },
  { files: rendererTests, renderer: true },
], (info, next) => {
  async.eachSeries(info.files, (file, done) => {
    console.log( chalk.magenta('Start test: ') + chalk.cyan( path.relative(cwd, file) ) );

    let args = ['./test', 'test'];

    // renderer
    if ( info.renderer ) {
      args.push('--renderer');
    }

    // detail
    if ( yargv.detail ) {
      args.push('--detail');
    }

    // reporter
    args.push('--reporter');
    if ( yargv.reporter ) {
      args.push(yargv.reporter);
    } else {
      args.push('spec');
    }

    // file
    args.push(file);

    let app = spawn(electron, args, {
      stdio: 'inherit',
    });

    app.on('message', data => {
      if ( data.channel === 'process:end' ) {
        if ( data.failures > 0 ) {
          failedTests.push(data.path);
        }
      }
    });

    app.on('exit', () => {
      done();
    });

  }, next );
}, err => {
  if (err) {
    throw err;
  }

  if ( !failedTests.length ) {
    console.log(chalk.green('================================='));
    console.log(chalk.green('All tests passed, Congratulations! '));
    console.log(chalk.green('================================='));
    return;
  }

  console.log(chalk.red('================================='));
  console.log(chalk.red(`${failedTests.length} failes: `));
  console.log(chalk.red('================================='));

  failedTests.forEach(file => {
    // SpawnSync(
    //   exePath,
    //   [cwd, '--test', file, '--reporter', 'spec'],
    //   {stdio: 'inherit'}
    // );
    console.log(chalk.red(` - ${file}`));
  });

  throw new Error(`${failedTests.length} test(s) faield.`);
});
