'use strict';

const Fs = require('fire-fs');
const Del = require('del');
const Path = require('path');
const Diff = require('diff');
const Sinon = require('sinon');

//
suite(tap, 'package-build', {timeout: 2000}, t => {
  suite(t, 'test fixtures/packages/needs-build (core-level)', t => {
    const path = Editor.url('editor-framework://test/fixtures/packages/needs-build');

    t.beforeEach(done => {
      Sinon.spy( Editor.Package, 'build' );
      done();
    });

    t.afterEach(done => {
      Editor.Package.unload(path, () => {
        let pkgJsonPath = Path.join( path, 'package.json');
        let pkgJson = JSON.parse(Fs.readFileSync(pkgJsonPath));
        pkgJson.version = '0.0.1';
        Fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));

        Editor.Package.build.restore();
        done();
      });
    });

    t.test('it should build package before loading it', t => {
      Editor.Package.load(path, () => {
        t.equal(Editor.Package.build.calledOnce, true);
        t.equal(Fs.existsSync(Path.join(path,'bin/dev')), true);

        // check package.json
        let srcJsonObj = JSON.parse(Fs.readFileSync( Path.join( path, 'package.json')));
        let destJsonObj = JSON.parse(Fs.readFileSync( Path.join( path, 'bin/dev/package.json')));
        let diffs = Diff.diffJson(srcJsonObj, destJsonObj);
        let realDiff = [];
        diffs.forEach(part => {
          if ( part.added || part.removed ) {
            realDiff.push(part);
          }
        });
        t.equal(realDiff.length, 1);
        t.equal(realDiff[0].value, '  "build": "true",\n');
        t.equal(realDiff[0].removed, true);

        t.end();
      });
    });

    t.test('it should not build package if it is exists', t => {
      Editor.Package.load(path, () => {
        t.assert(Fs.existsSync(Path.join(path,'bin/dev')) );
        t.equal(Editor.Package.build.callCount, 0);

        t.end();
      });
    });

    t.test('it should use the built path for resources loading', t => {
      Editor.Package.load(path, () => {
        t.assert( Fs.existsSync(Path.join(path,'bin/dev')) );

        let packageInfo = Editor.Package.packageInfo(path);
        // let widgetInfo = Editor.Package.widgetInfo('simple-widget');
        let panelInfo = Editor.Package.panelInfo('needs-build');

        t.equal(packageInfo._path, path );
        t.equal(packageInfo._destPath, Path.join(path,'bin/dev') );
        // t.equal(widgetInfo.path, Path.join(path,'bin/dev/widget') );
        t.equal(panelInfo.path, Path.join(path,'bin/dev') );

        t.end();
      });
    });

    t.test('it should re-build package if src package.json has a different version', t => {
      let pkgJsonPath = Path.join( path, 'package.json');
      let pkgJson = JSON.parse(Fs.readFileSync(pkgJsonPath));
      pkgJson.version = '0.0.2';
      Fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));

      Editor.Package.load(path, () => {
        t.equal(Editor.Package.build.calledOnce, true);
        t.equal(Fs.existsSync(Path.join(path,'bin/dev')), true);

        let srcJsonObj = JSON.parse(Fs.readFileSync( Path.join( path, 'package.json')));
        let destJsonObj = JSON.parse(Fs.readFileSync( Path.join( path, 'bin/dev/package.json')));
        t.equal(srcJsonObj.version, destJsonObj.version);

        t.end();
      });
    });

    // after all
    Del.sync( Path.join(path,'bin') );
  });
});
