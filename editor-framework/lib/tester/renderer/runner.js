(() => {
  'use strict';

  //
  const Electron = require('electron');
  const Path = require('fire-path');

  //
  process.stdout.write = function (...args) {
    Electron.ipcRenderer.send.apply(
      Electron.ipcRenderer, ['stdout:write', ...args]
    );
  };

  let tap = require('../share/tap');
  tap.detail = Editor.argv.detail;
  tap.init(Editor.argv.reporter);
  tap.on('end', () => {
    Electron.ipcRenderer.send('tap:end', tap._fail);
  });

  window.tap = tap;
  window.helper = require('./helper');
  window.suite = tap.suite;

  window.addEventListener('resize', () => {
    if ( window.helper.targetEL ) {
      window.helper.targetEL.dispatchEvent( new window.CustomEvent('resize') );
    }
  });

  window.onerror = function ( message, filename, lineno, colno, err ) {
    Electron.ipcRenderer.send('tap:error', err.stack || err);
  };

  // glob files
  let files = Editor.argv.files;
  files.forEach(file => {
    let fullpath = Path.resolve(file);
    try {
      require(fullpath);
    } catch (err) {
      Electron.ipcRenderer.send('tap:error', `Failed to load spec: ${file}\n ${err.stack}`);
    }
  });

  tap.end();
})();
