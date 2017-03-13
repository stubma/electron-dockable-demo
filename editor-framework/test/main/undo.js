'use strict';

let _foo = {};
class FooCmd extends Editor.Undo.Command {
  undo () {
    _foo = JSON.parse(this.info.before);
  }
  redo () {
    _foo = JSON.parse(this.info.after);
  }
}

let _bar = {};
class BarCmd extends Editor.Undo.Command {
  undo () {
    _bar = JSON.parse(this.info.before);
  }
  redo () {
    _bar = JSON.parse(this.info.after);
  }
}

class DummyCmd extends Editor.Undo.Command {
  undo () {}
  redo () {}
  dirty () { return false; }
}

suite(tap, 'undo', {timeout: 2000}, t => {
  helper.runEditor(tap, {
    'undo': {
      'foo': FooCmd,
      'bar': BarCmd,
      'dummy': DummyCmd,
    }
  });

  t.beforeEach(done => {
    _foo = {};
    _bar = {};

    Editor.Undo.clear();
    helper.reset();

    done();
  });

  t.test('it should add the foo commands', t => {
    let before = JSON.stringify(_foo);
    _foo.a = 'a';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    before = JSON.stringify(_foo);
    _foo.b = 'b';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    before = JSON.stringify(_foo);
    _foo.c = 'c';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    // ----------

    t.equal(Editor.Undo._global._groups.length, 3);
    t.equal(Editor.Undo._global._groups[2]._commands[0].info.after, JSON.stringify({
      a: 'a', b: 'b', c: 'c'
    }));

    t.end();
  });

  t.test('should undo the foo object correctly', t => {
    let before = JSON.stringify(_foo);
    _foo.a = 'a';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    before = JSON.stringify(_foo);
    _foo.b = 'b';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    before = JSON.stringify(_foo);
    _foo.c = 'c';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    // ----------

    t.same(_foo, {
      a: 'a',
      b: 'b',
      c: 'c',
    });

    Editor.Undo.undo();
    t.same(_foo, {
      a: 'a',
      b: 'b',
    });

    Editor.Undo.undo();
    t.same(_foo, {
      a: 'a',
    });

    Editor.Undo.undo();
    t.same(_foo, {});

    t.end();
  });


  t.test('it should redo the foo object correctly', t => {
    let before = JSON.stringify(_foo);
    _foo.a = 'a';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    before = JSON.stringify(_foo);
    _foo.b = 'b';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    before = JSON.stringify(_foo);
    _foo.c = 'c';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    // ----------

    t.same(_foo, {
      a: 'a',
      b: 'b',
      c: 'c',
    });

    Editor.Undo.undo();
    Editor.Undo.undo();
    Editor.Undo.undo();
    t.same(_foo, {});

    // again, will not over it
    Editor.Undo.undo();
    t.same(_foo, {});

    Editor.Undo.redo();
    t.same(_foo, {
      a: 'a',
    });

    Editor.Undo.redo();
    t.same(_foo, {
      a: 'a',
      b: 'b',
    });

    Editor.Undo.redo();
    t.same(_foo, {
      a: 'a',
      b: 'b',
      c: 'c',
    });

    // again, will not over it
    Editor.Undo.redo();
    t.same(_foo, {
      a: 'a',
      b: 'b',
      c: 'c',
    });

    t.end();
  });

  t.test('it should undo or redo different command in order', t => {
    let before = JSON.stringify(_foo);
    _foo.a = 'a';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    // undo 4
    before = JSON.stringify(_foo);
    _foo.b = 'b';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    // undo 3
    before = JSON.stringify(_bar);
    _bar.a = 'a';
    Editor.Undo.add('bar', { before: before, after: JSON.stringify(_bar) } );
    Editor.Undo.commit();

    // undo 2
    before = JSON.stringify(_foo);
    _foo.c = 'c';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    // undo 1
    before = JSON.stringify(_foo);
    _foo.d = 'd';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    // ----------

    // current snap-shot
    t.same(_foo, {
      a: 'a',
      b: 'b',
      c: 'c',
      d: 'd',
    });
    t.same(_bar, {
      a: 'a',
    });

    // undo 1
    Editor.Undo.undo();
    t.same(_foo, {
      a: 'a',
      b: 'b',
      c: 'c',
    });
    t.same(_bar, {
      a: 'a',
    });

    // undo 2
    Editor.Undo.undo();
    t.same(_foo, {
      a: 'a',
      b: 'b',
    });
    t.same(_bar, {
      a: 'a',
    });

    // undo 3
    Editor.Undo.undo();
    t.same(_foo, {
      a: 'a',
      b: 'b',
    });
    t.same(_bar, {
    });

    // undo 4
    Editor.Undo.undo();
    t.same(_foo, {
      a: 'a',
    });
    t.same(_bar, {
    });

    // redo 1
    Editor.Undo.redo();
    t.same(_foo, {
      a: 'a',
      b: 'b',
    });
    t.same(_bar, {
    });

    // redo 2
    Editor.Undo.redo();
    t.same(_foo, {
      a: 'a',
      b: 'b',
    });
    t.same(_bar, {
      a: 'a',
    });

    t.end();
  });

  t.test('it should undo or redo batched command in correctly', t => {
    // undo 3
    let beforeF = JSON.stringify(_foo);
    let beforeB = JSON.stringify(_bar);
    _foo.a = 'a';
    Editor.Undo.add('foo', { before: beforeF, after: JSON.stringify(_foo) } );
    Editor.Undo.add('bar', { before: beforeB, after: JSON.stringify(_bar) } );
    Editor.Undo.commit();

    // undo 2
    beforeF = JSON.stringify(_foo);
    beforeB = JSON.stringify(_bar);
    _foo.b = 'b';
    _bar.a = 'a';
    Editor.Undo.add('foo', { before: beforeF, after: JSON.stringify(_foo) } );
    Editor.Undo.add('bar', { before: beforeB, after: JSON.stringify(_bar) } );
    Editor.Undo.commit();

    // undo 1
    beforeF = JSON.stringify(_foo);
    beforeB = JSON.stringify(_bar);
    _foo.c = 'c';
    _bar.b = 'b';
    Editor.Undo.add('foo', { before: beforeF, after: JSON.stringify(_foo) } );
    Editor.Undo.add('bar', { before: beforeB, after: JSON.stringify(_bar) } );
    Editor.Undo.commit();

    // ----------

    // current snap-shot
    t.same(_foo, {
      a: 'a',
      b: 'b',
      c: 'c',
    });
    t.same(_bar, {
      a: 'a',
      b: 'b',
    });

    // undo 1
    Editor.Undo.undo();
    t.same(_foo, {
      a: 'a',
      b: 'b',
    });
    t.same(_bar, {
      a: 'a',
    });

    // undo 2
    Editor.Undo.undo();
    t.same(_foo, {
      a: 'a',
    });
    t.same(_bar, {});

    // undo 3
    Editor.Undo.undo();
    t.same(_foo, {});
    t.same(_bar, {});

    // redo 1
    Editor.Undo.redo();
    t.same(_foo, {
      a: 'a',
    });
    t.same(_bar, {});

    // redo 2
    Editor.Undo.redo();
    t.same(_foo, {
      a: 'a',
      b: 'b',
    });
    t.same(_bar, {
      a: 'a',
    });

    // redo 3
    Editor.Undo.redo();
    t.same(_foo, {
      a: 'a',
      b: 'b',
      c: 'c',
    });
    t.same(_bar, {
      a: 'a',
      b: 'b',
    });

    t.end();
  });

  t.test('it should work with dirty', t => {
    // initial
    t.equal(Editor.Undo.dirty(), false);

    // 1
    Editor.Undo.add('dummy');
    Editor.Undo.commit();

    t.equal(Editor.Undo.dirty(), false);

    // 2
    Editor.Undo.add('dummy');
    Editor.Undo.commit();

    t.equal(Editor.Undo.dirty(), false);

    // 3
    Editor.Undo.add('foo', { before: {}, after: {} } );
    Editor.Undo.commit();

    t.equal(Editor.Undo.dirty(), true);

    // 4
    Editor.Undo.save();
    t.equal(Editor.Undo.dirty(), false);

    // 5
    Editor.Undo.add('foo', { before: {}, after: {} } );
    Editor.Undo.add('dummy');
    Editor.Undo.commit();

    t.equal(Editor.Undo.dirty(), true);

    t.end();
  });

  t.test('it should work with collapse', t => {
    let before = JSON.stringify(_foo);
    _foo.a = 'a';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    before = JSON.stringify(_foo);
    _foo.b = 'b';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    before = JSON.stringify(_foo);
    _foo.c = 'c';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    //
    Editor.Undo.collapseTo(0);
    t.equal(Editor.Undo._global._groups.length, 1);
    t.equal(Editor.Undo.dirty(), true);

    Editor.Undo.undo();
    t.same(_foo, {});
    Editor.Undo.redo();
    t.same(_foo, {
      a: 'a',
      b: 'b',
      c: 'c',
    });

    t.end();
  });
});
