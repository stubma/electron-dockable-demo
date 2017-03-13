'use strict';

const electron = require('electron');
const spawn = require('child_process').spawn;

let processArgv, appPath;

if ( process.argv.length === 2 ) {
  appPath = './demo/';
  processArgv = process.argv.slice(2);
} else {
  appPath = process.argv[2];
  processArgv = process.argv.slice(3);
}

let args = [appPath].concat(processArgv);

let app = spawn(electron, args, {
  stdio: 'inherit'
});

app.on('close', () => {
  // User closed the app. Kill the host process.
  process.exit();
});
