'use strict';

suite(tap, 'errors', t => {
  let obj;

  t.test('it should report error', t => {
    t.equal(obj.nothing, 'foobar');
    t.end();
  });

  t.test('it should report error in nested function', t => {
    setTimeout(() => {
      t.equal(obj.nothing, 'foobar');
      t.end();
    }, 10 );
  });
});
