'use strict';

// NOTE: This is test runner for editor-framework, it covers the test cases for developing editor-framework
// It is different than github.com/fireball-packages/tester, which is for package developers to test their pacakges.

const Path = require('fire-path');
const Fs = require('fire-fs');
const Async = require('async');

// ==============================
// exports
// ==============================

let Builder = {
  //
  buildPackage ( path, cb ) {
    let packageJsonPath = Path.join( path, 'package.json' );
    let packageObj;

    try {
      packageObj = JSON.parse(Fs.readFileSync(packageJsonPath));
    } catch (err) {
      if ( cb ) {
        cb ( new Error( `Failed to load 'package.json': ${err.message}` ) );
      }
      return;
    }

    if ( !packageObj.build ) {
      if ( cb ) {
        cb ();
      }
      return;
    }

    Editor.info(`=== Build ${path} ===`);
    Editor.Package.build(path, cb);
  },

  // run
  run ( path ) {
    // build all-packages
    if ( !path ) {
      Async.eachSeries(Editor.Package.paths, (searchPath, done) => {
        if ( !Fs.existsSync(searchPath) ) {
          done();
          return;
        }

        let files = Fs.readdirSync(searchPath);

        Async.eachSeries(files, (name, next) => {
          let packagePath = Path.join(searchPath,name);
          if ( !Fs.isDirSync(packagePath) ) {
            next();
            return;
          }
          if ( !Fs.existsSync(Path.join(packagePath,'package.json')) ) {
            next();
            return;
          }

          Builder.buildPackage(packagePath, next);
        }, done);
      }, err => {
        if ( err ) {
          Editor.error(`Building failed: ${err.message}`);
          process.exit(1);
          return;
        }

        process.exit(0);
      });

      return;
    }

    //
    if ( !Fs.existsSync(path) ) {
      Editor.error(`The path ${path} you provided does not exist.`);
      process.exit(1);
      return;
    }

    //
    Builder.buildPackage( path, err => {
      if ( err ) {
        Editor.error(`Failed to build ${path}: ${err.message}`);
        process.exit(1);
      }
      process.exit(0);
    });

  },
};

module.exports = Builder;
