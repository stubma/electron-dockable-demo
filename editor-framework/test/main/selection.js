'use strict';

suite(tap, 'selection', {timeout: 2000}, t => {
  helper.runEditor(t, {
    'selection': ['normal', 'special'],
  });

  t.beforeEach(done => {
    Editor.Selection.clear('normal');
    Editor.Selection.clear('special');
    helper.reset();

    done();
  });

  suite(t, 'Editor.Selection.select', t => {

    t.test('it should work for simple case', t => {
      Editor.Selection.select('normal', 'a' );
      t.same(Editor.Selection.curSelection('normal'), ['a']);
      t.equal(Editor.Selection.curActivate('normal'), 'a');

      Editor.Selection.select('normal', 'b' );
      t.same(Editor.Selection.curSelection('normal'), ['b']);
      t.equal(Editor.Selection.curActivate('normal'), 'b');

      t.end();
    });

    t.test('it should work with array', t => {
      Editor.Selection.select('normal', ['a','b'] );
      t.same(Editor.Selection.curSelection('normal'), ['a','b']);
      t.equal(Editor.Selection.curActivate('normal'), 'b');

      Editor.Selection.select('normal', ['c','d'] );
      t.same(Editor.Selection.curSelection('normal'), ['c','d']);
      t.equal(Editor.Selection.curActivate('normal'), 'd');

      t.end();
    });

    t.test('it should work with confirm', t => {
      Editor.Selection.select('normal', 'a', false, false );
      Editor.Selection.select('normal', 'b', false, false );
      Editor.Selection.select('normal', 'c', false, false );
      Editor.Selection.select('normal', 'd', false, false );

      t.same(Editor.Selection.curSelection('normal'), ['a','b','c','d']);
      t.equal(Editor.Selection.curActivate('normal'), null);

      Editor.Selection.confirm();
      t.equal(Editor.Selection.curActivate('normal'), 'd');

      t.end();
    });

    t.test('it should work with cancel', t => {
      Editor.Selection.select('normal', 'a' );
      Editor.Selection.select('normal', 'b', false, false );
      Editor.Selection.select('normal', 'c', false, false );
      Editor.Selection.select('normal', 'd', false, false );

      Editor.Selection.cancel();
      t.same(Editor.Selection.curSelection('normal'), ['a']);
      t.equal(Editor.Selection.curActivate('normal'), 'a');

      t.end();
    });

    t.test('should active none when nothing select', t => {
      Editor.Selection.select('normal', ['a','b','c','d'] );
      Editor.Selection.select('normal', [] );

      t.same(Editor.Selection.curSelection('normal'), []);
      t.equal(Editor.Selection.curActivate('normal'), null);

      Editor.Selection.select('normal', ['a','b','c','d'] );
      Editor.Selection.select('normal', null );

      t.same(Editor.Selection.curSelection('normal'), []);
      t.equal(Editor.Selection.curActivate('normal'), null);

      Editor.Selection.select('normal', ['a','b','c','d'] );
      Editor.Selection.select('normal', '' );

      t.same(Editor.Selection.curSelection('normal'), []);
      t.equal(Editor.Selection.curActivate('normal'), null);

      t.end();
    });

    // NOTE: I am argue about this
    t.test('it should not break the order of the selection when item already selected', t => {
      Editor.Selection.select('normal', ['a','b','c','d'] );
      t.same(Editor.Selection.curSelection('normal'), ['a','b','c','d']);
      t.equal(Editor.Selection.curActivate('normal'), 'd');

      Editor.Selection.select('normal', ['d','e','c','b'] );
      t.same(Editor.Selection.curSelection('normal'), ['b','c','d','e']);
      t.equal(Editor.Selection.curActivate('normal'), 'b');

      t.end();
    });

    t.test('it should not break the order of the selection when selection not confirmed', t => {
      Editor.Selection.select('normal', ['a','b','c','d'], false );
      t.same(Editor.Selection.curSelection('normal'), ['a','b','c','d']);

      Editor.Selection.select('normal', ['d','e','c','b'], false );
      t.same(Editor.Selection.curSelection('normal'), ['a', 'b','c','d','e']);

      Editor.Selection.confirm();
      t.equal(Editor.Selection.curActivate('normal'), 'b');

      t.end();
    });

    t.test('it should send ipc selection:selected when select item', t => {
      helper.spyMessages( 'sendToAll', [
        'selection:selected',
        'selection:unselected',
      ]);

      //
      Editor.Selection.select('normal', 'a' );

      t.assert( helper.sendToAll.calledWith('selection:selected', 'normal', ['a']) );
      t.assert( helper.sendToAll.calledWith('selection:activated', 'normal', 'a') );

      //
      Editor.Selection.select('normal', 'b' );

      t.assert( helper.sendToAll.calledWith('selection:unselected', 'normal', ['a']) );
      t.assert( helper.sendToAll.calledWith('selection:selected', 'normal', ['b']) );
      t.assert( helper.sendToAll.calledWith('selection:deactivated', 'normal', 'a') );
      t.assert( helper.sendToAll.calledWith('selection:activated', 'normal', 'b') );

      //
      Editor.Selection.select('normal', ['c','d'] );

      t.assert( helper.sendToAll.calledWith('selection:unselected', 'normal', ['b']) );
      t.assert( helper.sendToAll.calledWith('selection:selected', 'normal', ['c','d']) );
      t.assert( helper.sendToAll.calledWith('selection:deactivated', 'normal', 'b') );
      t.assert( helper.sendToAll.calledWith('selection:activated', 'normal', 'd') );

      //
      Editor.Selection.select('normal', ['a','b'] );

      t.assert( helper.sendToAll.calledWith('selection:unselected', 'normal', ['c','d']) );
      t.assert( helper.sendToAll.calledWith('selection:selected', 'normal', ['a','b']) );
      t.assert( helper.sendToAll.calledWith('selection:deactivated', 'normal', 'd') );
      t.assert( helper.sendToAll.calledWith('selection:activated', 'normal', 'b') );

      //
      t.equal(helper.message('sendToAll','selection:selected').callCount, 4);
      t.equal(helper.message('sendToAll','selection:unselected').callCount, 3);

      t.end();
    });

    t.test('it should not send ipc selection:selected when the item already selected', t => {
      helper.spyMessages( 'sendToAll', [
        'selection:selected',
      ]);
      let ipcSelected = helper.message('sendToAll','selection:selected');

      Editor.Selection.select('normal', 'a', false );
      Editor.Selection.select('normal', 'a', false );
      Editor.Selection.select('normal', 'b', false );
      Editor.Selection.select('normal', ['a','b'], false );
      Editor.Selection.select('normal', ['a','b','c','d'], false );

      t.assert(ipcSelected.getCall(0).calledWith('selection:selected', 'normal', ['a']) );
      t.assert(ipcSelected.getCall(1).calledWith('selection:selected', 'normal', ['b']) );
      t.assert(ipcSelected.getCall(2).calledWith('selection:selected', 'normal', ['c','d']) );
      t.equal(ipcSelected.callCount, 3);

      t.end();
    });

    t.test('it should send ipc message in order', t => {
      Editor.Selection.select('normal', 'a' );
      Editor.Selection.select('normal', 'b' );

      t.same(helper.sendToAll.args, [
        ['_selection:selected', 'normal', ['a'], { __ipc__: true, excludeSelf: true } ],
        ['selection:selected', 'normal', ['a'] ],

        ['_selection:activated', 'normal', 'a', { __ipc__: true, excludeSelf: true } ],
        ['selection:activated', 'normal', 'a' ],

        ['_selection:changed', 'normal', { __ipc__: true, excludeSelf: true } ],
        ['selection:changed', 'normal' ],

        ['_selection:unselected', 'normal', ['a'], { __ipc__: true, excludeSelf: true } ],
        ['selection:unselected', 'normal', ['a'] ],

        ['_selection:selected', 'normal', ['b'], { __ipc__: true, excludeSelf: true } ],
        ['selection:selected', 'normal', ['b'] ],

        ['_selection:deactivated', 'normal', 'a', { __ipc__: true, excludeSelf: true } ],
        ['selection:deactivated', 'normal', 'a' ],

        ['_selection:activated', 'normal', 'b', { __ipc__: true, excludeSelf: true } ],
        ['selection:activated', 'normal', 'b' ],

        ['_selection:changed', 'normal', { __ipc__: true, excludeSelf: true } ],
        ['selection:changed', 'normal' ],
      ]);

      t.end();
    });
  });

  suite(t, 'Editor.Selection.unselect', t => {
    t.test('it should work for simple case', t => {
      Editor.Selection.select('normal',['a','b','c','d']);
      Editor.Selection.unselect('normal','c');

      t.same(Editor.Selection.curSelection('normal'), ['a','b','d']);

      Editor.Selection.unselect('normal',['d','a']);
      t.same(Editor.Selection.curSelection('normal'), ['b']);

      Editor.Selection.unselect('normal','d');
      t.same(Editor.Selection.curSelection('normal'), ['b']);

      Editor.Selection.unselect('normal',['a','b','c','d']);
      t.same(Editor.Selection.curSelection('normal'), []);

      t.end();
    });

    t.test('it should not sending non-selected items in the ipc message when unselect', t => {
      Editor.Selection.select('normal',['a','b','c','d']);
      Editor.Selection.unselect('normal',['d','e']);

      t.assert( helper.sendToAll.calledWith('selection:unselected', 'normal', ['d']) );
      t.assert( helper.sendToAll.calledWith('selection:deactivated', 'normal', 'd') );

      Editor.Selection.unselect('normal',['b','c']);
      t.assert( helper.sendToAll.calledWith('selection:unselected', 'normal', ['b','c']) );
      t.assert( helper.sendToAll.calledWith('selection:deactivated', 'normal', 'c') );

      t.end();
    });
  });

  suite(t, 'Editor.Selection.hover', t => {
    t.test('it should store the last hover item', t => {

      Editor.Selection.hover('normal','a');
      t.equal(Editor.Selection.hovering('normal'), 'a');

      Editor.Selection.hover('normal','b');
      t.equal(Editor.Selection.hovering('normal'), 'b');

      Editor.Selection.hover('normal','c');
      t.equal(Editor.Selection.hovering('normal'), 'c');

      Editor.Selection.hover('normal',null);
      t.equal(Editor.Selection.hovering('normal'), null);

      t.end();
    });

    t.test('it should send hover and unhover ipc message in order', t => {

      Editor.Selection.hover('normal','a');
      Editor.Selection.hover('normal','b');
      Editor.Selection.hover('normal',null);

      t.same(helper.sendToAll.args, [
        ['_selection:hoverin', 'normal', 'a', { __ipc__: true, excludeSelf: true } ],
        ['selection:hoverin', 'normal', 'a' ],

        ['_selection:hoverout', 'normal', 'a', { __ipc__: true, excludeSelf: true } ],
        ['selection:hoverout', 'normal', 'a' ],

        ['_selection:hoverin', 'normal', 'b', { __ipc__: true, excludeSelf: true } ],
        ['selection:hoverin', 'normal', 'b' ],

        ['_selection:hoverout', 'normal', 'b', { __ipc__: true, excludeSelf: true } ],
        ['selection:hoverout', 'normal', 'b' ],
      ]);

      t.end();
    });
  });

  suite(t, 'Editor.Selection.setContext', t => {
    t.test('it should store the context', t => {
      Editor.Selection.select('normal',['a','b','c','d']);
      Editor.Selection.setContext('normal','e');

      t.same(Editor.Selection.contexts('normal'), ['e']);

      Editor.Selection.setContext('normal','c');
      t.same(Editor.Selection.contexts('normal'), ['c','a','b','d']);

      t.end();
    });
  });

  suite(t, 'Editor.Selection.clear', t => {
    t.test('it should not send changed ipc message when clear multiple times', t => {
      let ipcChanged = helper.sendToAll.withArgs('selection:changed');

      Editor.Selection.clear('normal');
      Editor.Selection.clear('normal');
      Editor.Selection.clear('normal');
      Editor.Selection.clear('normal');
      t.equal(ipcChanged.callCount, 0);

      Editor.Selection.select('normal',['a','b','c','d']);
      t.equal(ipcChanged.callCount, 1);

      Editor.Selection.clear('normal');
      t.equal(ipcChanged.callCount, 2);

      Editor.Selection.clear('normal');
      t.equal(ipcChanged.callCount, 2);

      t.end();
    });
  });

  suite(t, 'Global Active', t => {
    t.test('it should change global active call selection confirmed in different type', t => {
      Editor.Selection.select('normal', ['a','b','c','d']);
      t.same(Editor.Selection.curGlobalActivate(), {
        type: 'normal',
        id: 'd',
      });

      Editor.Selection.select('special', ['a1','b1','c1','d1']);
      t.same(Editor.Selection.curGlobalActivate(), {
        type: 'special',
        id: 'd1',
      });

      Editor.Selection.select('normal', ['a','b','c','d']);
      t.same(Editor.Selection.curGlobalActivate(), {
        type: 'normal',
        id: 'd',
      });

      Editor.Selection.unselect('special', 'd1');
      t.same(Editor.Selection.curGlobalActivate(), {
        type: 'special',
        id: 'c1',
      });

      t.end();
    });

    t.test('it should send activated and deactivated ipc message', t => {
      helper.spyMessages('sendToAll', ['selection:deactivated']);
      let ipcDeactivated = helper.message('sendToAll', 'selection:deactivated');

      Editor.Selection.select('normal', ['a','b','c','d']);
      t.assert( helper.sendToAll.calledWith('selection:activated', 'normal', 'd') );

      Editor.Selection.select('special', ['a1','b1','c1','d1']);
      t.assert( !ipcDeactivated.called );
      t.assert( helper.sendToAll.calledWith('selection:activated', 'special', 'd1') );

      Editor.Selection.select('normal', ['a','b','c','d']);
      t.assert( !ipcDeactivated.called );
      t.assert( helper.sendToAll.calledWith('selection:activated', 'normal', 'd') );

      t.end();
    });
  });

  suite(t, 'Local Selection', t => {
    let local = Editor.Selection.local();

    t.beforeEach(done => {
      local.clear();
      done();
    });

    t.test('it should not send ipc message', t => {
      helper.spyMessages( 'sendToAll', [
        'selection:selected',
        'selection:unselected',
      ]);

      //
      local.select('a');
      t.same(local.selection, ['a']);
      t.equal(local.lastActive, 'a');

      local.select('b');
      t.same(local.selection, ['b']);
      t.equal(local.lastActive, 'b');

      t.assert( helper.sendToAll.neverCalledWith('selection:selected') );
      t.assert( helper.sendToAll.neverCalledWith('selection:unselected') );

      t.end();
    });
  });

});
