'use strict';

const Path = require('fire-path');

suite(tap, 'protocol', {timeout: 2000}, t => {
  t.test('it should return original path if we don\'t provide protocol', t => {
    t.equal(Editor.url('foo/bar/foobar.js'), 'foo/bar/foobar.js');

    t.end();
  });

  t.test('it should return original if the protocol is default protocol', t => {
    t.equal(Editor.url('http://foo/bar/foobar.js'), 'http://foo/bar/foobar.js');
    t.equal(Editor.url('https://foo/bar/foobar.js'), 'https://foo/bar/foobar.js');
    t.equal(Editor.url('ftp://foo/bar/foobar.js'), 'ftp://foo/bar/foobar.js');
    t.equal(Editor.url('ssh://foo/bar/foobar.js'), 'ssh://foo/bar/foobar.js');
    t.equal(Editor.url('file:///foo/bar/foobar.js'), 'file:///foo/bar/foobar.js');

    t.end();
  });

  t.test('it should return registerred protocol path', t => {
    t.equal(
      Editor.url('app://foo/bar/foobar.js'),
      Path.join(Editor.App.path, 'foo/bar/foobar.js')
    );

    t.end();
  });
});
