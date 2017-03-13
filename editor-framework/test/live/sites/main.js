'use strict';

suite(tap, 'sites', t => {
  t.test('choose a site', () => {
    const Electron = require('electron');
    let win = new Electron.BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        allowDisplayingInsecureContent: true,
        allowRunningInsecureContent: true,
      }
    });

    // flexbox bug
    // REF: https://github.com/angular/material/issues/6841
    // REF: https://bugs.chromium.org/p/chromium/issues/detail?id=580196
    win.loadURL('http://jpdevries.github.io/eureka/examples/');

    // webgl report
    // win.loadURL('http://webglreport.com/');
  });
});
