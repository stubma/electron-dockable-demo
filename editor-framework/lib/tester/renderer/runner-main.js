'use strict';

const Electron = require('electron');

const Path = require('fire-path');
const Fs = require('fire-fs');
const Globby = require('globby');
const Chalk = require('chalk');

function _logError (text) {
  console.log(Chalk.red(text));
}

module.exports = function (path, opts, cb) {
  let files = [];
  if ( Fs.isDirSync(path) ) {
    files = Globby.sync([
      Path.join(path,'**/*.js'),
      '!'+Path.join(path,'**/*.skip.js'),
      '!**/fixtures/**',
    ]);
  } else {
    files = [path];
  }

  let win = new Editor.Window('__test__', {
    'title': 'Testing Renderer...',
    'width': 400,
    'height': 300,
    'show': false,
    'resizable': true,
  });
  Editor.Window.main = win;

  const ipcMain = Electron.ipcMain;

  ipcMain.on('stdout:write', (event, ...args) => {
    process.stdout.write.apply(process.stdout, args);
  });

  ipcMain.on('tap:error', (event, message) => {
    _logError(message);
  });

  ipcMain.on('tap:end', (event, failures) => {
    if ( opts.detail ) {
      // open devtools if there has failed tests
      if ( failures ) {
        win.openDevTools();
      }

      return;
    }

    win.close();

    if ( cb ) {
      cb ( failures );
    }
  });

  // load and show main window
  win.show();

  // page-level test case
  win.load('editor-framework://lib/tester/renderer/index.html', {
    files: files,
    detail: opts.detail,
    reporter: opts.reporter,
  });
};
