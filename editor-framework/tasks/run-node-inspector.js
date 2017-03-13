'use strict';

const electron = require('electron');
const spawn = require('child_process').spawn;

let app = spawn(electron, [
  'node_modules/node-inspector/bin/inspector.js'
], {
  stdio: 'inherit',
  env: {
    ELECTRON_RUN_AS_NODE: true
  },
});

app.on('close', () => {
  // User closed the app. Kill the host process.
  process.exit();
});
