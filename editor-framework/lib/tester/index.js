'use strict';

// NOTE: This is test runner for editor-framework, it covers the test cases for developing editor-framework
// It is different than github.com/fireball-packages/tester, which is for package developers to test their pacakges.

const Path = require('fire-path');
const Fs = require('fire-fs');
const Chalk = require('chalk');

// NOTE: message for tester panel
process.on('message', data => {
  switch ( data.channel ) {
  case 'tester:reload':
    if ( !Editor.Window.main ) {
      return;
    }
    Editor.Window.main.nativeWin.reload();
    break;

  case 'tester:active-window':
    if ( !Editor.Window.main ) {
      return;
    }
    Editor.Window.main.nativeWin.focus();
    break;

  case 'tester:exit':
    process.exit(0);
    break;
  }
});

// ==============================
// exports
// ==============================

let Tester = {
  // runPackage
  runPackage ( path, opts, cb ) {
    const FindUp = require('find-up');
    FindUp('package.json', {cwd: path}).then(file => {
      if ( !file ) {
        _logError(`Cannot find package.json in ${file}`);
        return;
      }

      // load package
      let packagePath = Path.dirname(file);
      if ( !Path.isAbsolute(packagePath) ) {
        packagePath = Path.join(Editor.App.path,packagePath);
      }

      Editor.Package.load(packagePath, {build: true}, () => {
        // if the path is not a specific test, run all tests in the package
        let runAllTest = true;
        if ( path.indexOf('test') !== -1 ) {
          runAllTest = false;
        }

        //
        if ( runAllTest ) {
          const Async = require('async');
          let totalFailures = 0;
          let testPath = Path.join(packagePath,'test');

          Async.series([
            next => {
              Tester.runRenderer(Path.join(testPath,'renderer'), opts, failures => {
                totalFailures += failures;
                next ();
              });
            },

            next => {
              Tester.runMain(Path.join(testPath,'main'), opts, failures => {
                totalFailures += failures;
                next ();
              });
            },
          ], () => {
            if ( cb ) {
              cb (totalFailures);
            }
          });

          return;
        }

        // run test in renderer process
        if ( opts.renderer || path.indexOf('renderer') !== -1 ) {
          Tester.runRenderer(path,opts,cb);
          return;
        }

        // run test in main process
        Tester.runMain(path,opts,cb);
      });
    });

  },

  // runRenderer
  runRenderer ( path, opts, cb ) {
    let runner = require('./renderer/runner-main');
    runner(path, opts, cb);
  },

  // runMain
  runMain ( path, opts, cb ) {
    let runner = require('./main/runner');
    runner(path, opts, cb);
  },

  // run
  run ( path, opts ) {
    path = path || Path.join( Editor.App.path, 'test' );

    //
    if ( !Fs.existsSync(path) ) {
      _logError(`The path ${path} you provide does not exist.`);
      process.exit(1);
      return;
    }

    // reset main menu for test
    Editor.Menu.register('main-menu', require('./main-menu'), true);
    Editor.MainMenu.init();

    //
    function _done ( failures ) {
      if ( process.send ) {
        process.send({
          channel: 'process:end',
          failures: failures,
          path: path,
        });
      }
      process.exit(failures);
    }

    // run test in specific package
    if ( opts.package ) {
      Tester.runPackage(path,opts,_done);
      return;
    }

    // run test in renderer process
    if ( opts.renderer || path.indexOf('renderer') !== -1 ) {
      Tester.runRenderer(path,opts,_done);
      return;
    }

    // run test in main process
    Tester.runMain(path,opts,_done);
  },
};

module.exports = Tester;

// ==============================
// Internal
// ==============================

function _logError (text) {
  console.log(Chalk.red(text));
}
