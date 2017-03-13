'use strict';

const Fs = require('fire-fs');
const Path = require('fire-path');
const Async = require('async');

//
suite(tap, 'package', {timeout: 2000}, t => {
  const testPackages = Editor.url('editor-framework://test/fixtures/packages/');

  helper.runEditor(t, {
    'package-search-path': [
      'editor-framework://test/fixtures/packages/'
    ],
  });

  suite(t, 'fixtures/packages/simple', t => {
    const path = Path.join(testPackages,'simple');

    t.afterEach(done => {
      Editor.Package.unload(path, done);
    });

    t.test('should load simple package', t => {
      Editor.Package.load(path, t.end);
    });

    t.test('should unload simple package', t => {
      Async.series([
        next => { Editor.Package.load(path, next); },
        next => { Editor.Package.unload(path, next); },
      ], t.end);
    });
  });

  suite(t, 'fixtures/packages/simple ipc-message', t => {
    const path = Path.join(testPackages,'simple');

    t.assert( Fs.existsSync(path) );

    t.beforeEach(done => {
      helper.reset();
      done();
    });

    t.test('it should send loaded ipc message', t => {
      Editor.Package.load(path, () => {
        t.assert( helper.sendToWins.calledWith('editor:package-loaded', 'simple') );
        t.end();
      });
    });

    t.test('it should send unload message', t => {
      Async.series([
        next => { Editor.Package.load(path, next); },
        next => { Editor.Package.unload(path, next); },
      ], () => {
        t.assert( helper.sendToWins.calledWith('editor:package-unloaded', 'simple') );
        t.end();
      });
    });
  });

  suite(t, 'fixtures/packages/main-ipc', t => {
    const path = Path.join(testPackages,'main-ipc');

    t.assert( Fs.existsSync(path) );

    t.test('it should reply ipc messages', t => {
      Editor.Package.load(path, () => {
        Async.series([
          next => {
            Editor.Ipc.sendToMain('main-ipc:say-hello', (err, msg) => {
              t.equal(msg, 'hello');
              next();
            });
          },
          next => {
            Editor.Ipc.sendToMain('main-ipc:say-hello-02', (err, msg) => {
              t.equal(msg, 'hello-02');
              next();
            });
          },
          next => {
            Editor.Ipc.sendToMain('another:say-hello-03', (err, msg) => {
              t.equal(msg, 'hello-03');
              next();
            });
          },
        ], t.end);
      });
    });
  });

  suite(t, 'fixtures/packages/main-deps', t => {
    const path = Path.join(testPackages,'main-deps');

    t.afterEach(done => {
      Editor.Package.unload(path, done);
    });

    t.test('it should unload main-deps package', t => {
      let cache = require.cache;
      let loadCacheList = [];
      Async.series([
        next => { Editor.Package.load(path, next); },
        next => {
          for ( var name in cache ) {
            loadCacheList.push(cache[name].filename);
          }
          next();
        },
        next => { Editor.Package.unload(path, next); },
        next => {
          var index;
          for (var name in cache) {
            index = loadCacheList.indexOf(cache[name].filename);
            loadCacheList.splice(index, 1);
          }

          // main.js | core/test.js
          t.same(loadCacheList, [
            Path.join(path, 'main.js'),
            Path.join(path, 'core/test.js'),
            Path.join(path, 'core/foo/bar.js'),
            Path.join(path, 'test.js'),
          ]);

          next();
        },
      ], t.end);
    });
  });

  suite(t, 'fixtures/packages/package-json-broken', t => {
    const path = Path.join(testPackages,'package-json-broken');

    t.afterEach(done => {
      Editor.Package.unload(path, done);
    });

    t.test('it should report error when package.json broken', t => {
      Editor.Package.load(path, err => {
        t.assert(err);
        t.end();
      });
    });
  });

  suite(t, 'fixtures/packages/localize', t => {
    const path = Path.join(testPackages,'localize');

    t.test('it should load and unload en i18n file', t => {
      Editor.Package.lang = 'en';
      Editor.Package.load(path, () => {
        t.equal(Editor.T('localize.search'), 'Search');
        t.equal(Editor.T('localize.edit'), 'Edit');

        Editor.Package.unload(path, () => {
          t.equal(Editor.i18n._phrases().localize, undefined);
          t.end();
        });
      });
    });

    t.test('it should load zh i18n file', t => {
      Editor.Package.lang = 'zh';
      Editor.Package.load(path, () => {
        t.equal(Editor.T('localize.search'), '搜索');
        t.equal(Editor.T('localize.edit'), '编辑');

        Editor.Package.unload(path, t.end);
      });
    });
  });

  suite(t, 'fixtures/packages/host-not-exists', t => {
    const path = Path.join(testPackages,'host-not-exists');

    t.afterEach(done => {
      Editor.Package.unload(path, done);
    });

    t.test('it should report error when hosts not exists', t => {
      Editor.Package.load(path, err => {
        t.assert(err);
        t.end();
      });
    });
  });

  suite(t, 'fixtures/packages/main-js-broken', t => {
    const path = Path.join(testPackages,'main-js-broken');

    t.afterEach(done => {
      Editor.Package.unload(path, done);
    });

    t.test('it should report error when failed to load main.js', t => {
      Editor.Package.load(path, err => {
        t.assert(err);
        t.end();
      });
    });
  });

  suite(t, 'fixtures/packages/package-deps', t => {
    const path1 = Path.join(testPackages,'package-deps');
    const path2 = Path.join(testPackages,'dep-01');
    const path3 = Path.join(testPackages,'dep-02');

    t.beforeEach(done => {
      helper.reset();
      done();
    });

    t.afterEach(done => {
      Async.series([
        next => {
          Editor.Package.unload(path1, next);
        },
        next => {
          Editor.Package.unload(path2, next);
        },
        next => {
          Editor.Package.unload(path3, next);
        },
        next => {
          Editor.Package.removePath(testPackages);
          next();
        },
      ], done);
    });

    t.test('it should load dependencies first', t => {
      helper.spyMessages( 'sendToWins', [
        'editor:package-loaded',
      ]);
      let packageLoaded = helper.message('sendToWins','editor:package-loaded');

      Editor.Package.load(path1, () => {
        // console.log(packageLoaded.args);
        t.assert( packageLoaded.getCall(0).calledWith('editor:package-loaded', 'dep-02') );
        t.assert( packageLoaded.getCall(1).calledWith('editor:package-loaded', 'dep-01') );
        t.assert( packageLoaded.getCall(2).calledWith('editor:package-loaded', 'package-deps') );

        t.end();
      });
    });
  });

  // t.skip('should build fixtures/packages/needs-build', t => {
  // });

  // t.skip('should remove bin/dev when unload fixtures/packages/needs-build', t => {
  // });
});
