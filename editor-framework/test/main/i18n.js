'use strict';

suite(tap, 'i18n', {timeout: 2000}, t => {
  t.beforeEach(done => {
    Editor.i18n.extend({
      test: {
        foo: '腐',
        bar: '爸'
      }
    });

    done();
  });

  t.afterEach(done => {
    Editor.i18n.unset('test');

    done();
  });

  t.test('formatPath', t => {
    t.equal(Editor.i18n.formatPath('i18n:test.foo/i18n:test.bar/foobar'), '腐/爸/foobar');

    t.end();
  });
});
