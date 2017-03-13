'use strict';

suite(tap, 'menu', {timeout: 2000}, t => {
  function getTemplate () {
    return [
      {
        label: 'foo',
        submenu: [
        ],
      },

      {
        label: 'bar',
        submenu: [
          {
            label: 'bar.01',
          },
          {
            label: 'bar.02',
          },
        ],
      },
    ];
  }

  t.test('it should be built from template', t => {
    let testMenu = new Editor.Menu(getTemplate());

    t.equal( testMenu.nativeMenu.items.length, 2);
    t.equal( testMenu.nativeMenu.items[0].label, 'foo');

    t.end();
  });

  t.test('it should be able to add menu item through template', t => {
    let testMenu = new Editor.Menu();
    testMenu.add('foo/bar', getTemplate());

    t.equal( testMenu.nativeMenu.items[0].label, 'foo');
    t.equal( testMenu.nativeMenu.items[0].submenu.items[0].label, 'bar');

    t.end();
  });

  t.test('should be able to add menu item by path', t => {
    let testMenu = new Editor.Menu();
    testMenu.add('tar/zom', {message: 'hint'});

    t.equal( testMenu.nativeMenu.items[0].label, 'tar');
    t.equal( testMenu.nativeMenu.items[0].submenu.items[0].label, 'zom');

    t.end();
  });

  t.test('it should be able to add menu template array as submenu by path', t => {
    let testMenu = new Editor.Menu();
    testMenu.add('foo/bar', [
      { label: 'a', message: 'a' },
      { label: 'b', message: 'b' },
      { label: 'c', message: 'c' },
    ]);

    let items = testMenu.nativeMenu.items[0].submenu.items[0].submenu.items;
    t.equal(items.length, 3);
    t.equal(items[0].label, 'a');
    t.equal(items[1].label, 'b');
    t.equal(items[2].label, 'c');

    t.end();
  });

  t.test('it should be able to expand menu template if it contains path field', t => {
    let testMenu = new Editor.Menu();
    testMenu.add('foo/bar', [
      { path: 'foobar/a', message: 'a' },
      { path: 'foobar/b', message: 'b' },
      { path: 'foobar/c', message: 'c' },
    ]);

    let foobarItem = testMenu.nativeMenu
      .items[0].submenu
      .items[0].submenu
      .items[0]
      ;

    t.equal(foobarItem.label, 'foobar');
    t.equal(foobarItem.submenu.items[0].label, 'a');
    t.equal(foobarItem.submenu.items[1].label, 'b');
    t.equal(foobarItem.submenu.items[2].label, 'c');

    t.end();
  });

  t.test('it should be able to remove menu item by path', t => {
    let testMenu = new Editor.Menu(getTemplate());
    t.equal(testMenu.nativeMenu.items[1].submenu.items.length, 2);

    testMenu.remove('bar/bar.01');
    t.equal(testMenu.nativeMenu.items[1].submenu.items.length, 1);

    t.end();
  });

  t.test('it should be able to update exists sub-menu at root', t => {
    let tmpl = [
      {
        label: 'foo',
        submenu: [
          {
            label: 'foo.01',
          },
          {
            label: 'foo.02',
          },
        ],
      },

      {
        label: 'bar',
        submenu: [
          {
            label: 'bar.01',
          },
          {
            label: 'bar.02',
          },
        ],
      },
    ];

    let testMenu = new Editor.Menu(tmpl);
    testMenu.update( 'foo', [
      {
        label: 'foo.01.new',
      },
      {
        label: 'foo.02.new',
      },
      {
        label: 'foo.03.new',
      },
    ]);

    t.equal(testMenu.nativeMenu.items[0].submenu.items[0].label, 'foo.01.new');
    t.equal(testMenu.nativeMenu.items[0].submenu.items[1].label, 'foo.02.new');
    t.equal(testMenu.nativeMenu.items[0].submenu.items[2].label, 'foo.03.new');
    t.equal(testMenu.nativeMenu.items[1].label, 'bar');

    t.end();
  });

  t.test('it should be able to update exists sub-menu at path', t => {
    let tmpl = [
      {
        label: 'foo',
        submenu: [
          {
            label: 'foo.01',
            submenu: [
              {
                label: 'foo.01.a',
              },
              {
                label: 'foo.01.b',
              },
            ]
          },
          {
            label: 'foo.02',
          },
        ],
      },

      {
        label: 'bar',
        submenu: [
          {
            label: 'bar.01',
          },
          {
            label: 'bar.02',
          },
        ],
      },
    ];

    let testMenu = new Editor.Menu(tmpl);
    testMenu.update( 'foo/foo.01', [
      {
        label: 'foo.01.a.new',
      },
      {
        label: 'foo.01.b.new',
      },
      {
        label: 'foo.01.c.new',
      },
    ]);

    let fooFoo01 = testMenu.nativeMenu.items[0].submenu.items[0];
    t.equal(fooFoo01.submenu.items[0].label, 'foo.01.a.new');
    t.equal(fooFoo01.submenu.items[1].label, 'foo.01.b.new');
    t.equal(fooFoo01.submenu.items[2].label, 'foo.01.c.new');
    t.equal(testMenu.nativeMenu.items[0].submenu.items[1].label, 'foo.02');

    t.end();
  });

  t.test('it should not add dev template in release mode', t => {
    let oldDev = Editor.Menu.showDev;
    Editor.Menu.showDev = false;

    let tmpl = [
      {
        label: 'foo',
        submenu: [
        ],
        dev: true,
      },

      {
        label: 'bar',
        submenu: [
          {
            label: 'bar.01',
            dev: true,
          },
          {
            label: 'bar.02',
          },
        ],
      },
    ];

    let testMenu = new Editor.Menu(tmpl);

    t.equal(testMenu.nativeMenu.items.length, 1);
    t.equal(testMenu.nativeMenu.items[0].submenu.items[0].label, 'bar.02');

    Editor.Menu.showDev = oldDev;
    t.end();
  });

  t.test('should be able to parse template with path', t => {
    let tmpl = [
      { label: 'foo', type: 'submenu', submenu: [] },
      { label: 'bar', type: 'submenu', submenu: [] },
      { path: 'foo/foo.01', },
      { path: 'bar/bar.01', },
      { path: 'bar/bar.02', type: 'submenu', submenu: [] },
      { path: 'foobar/say hello', click: () => { console.log('hello world'); } },
      { label: 'a menu item', click: () => { console.log('a menu item'); } },
      { path: 'bar/bar.02/bar.02.01' },
      { path: 'a menu path item', click: () => { console.log('a menu item'); } },
    ];

    let testMenu = new Editor.Menu(tmpl);

    // basic
    t.equal(testMenu.nativeMenu.items[0].submenu.items[0].label, 'foo.01');
    t.equal(testMenu.nativeMenu.items[1].submenu.items[0].label, 'bar.01');
    t.equal(testMenu.nativeMenu.items[1].submenu.items[1].label, 'bar.02');

    // test if path can add in order
    t.equal(testMenu.nativeMenu.items[2].label, 'foobar');
    t.equal(testMenu.nativeMenu.items[3].label, 'a menu item');

    // test if first level path can be add correctly
    t.equal(testMenu.nativeMenu.items[4].label, 'a menu path item');

    // test if second level path can be add correctly
    t.equal(
      testMenu.nativeMenu.items[1].submenu.items[1].submenu.items[0].label,
      'bar.02.01'
    );

    t.end();
  });
});
