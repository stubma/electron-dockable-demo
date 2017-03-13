'use strict';

(() => {
  //
  try {
    const Electron = require('electron');
    const Path = require('fire-path');
    let EditorR;

    // init EditorR
    window.onerror = function ( message, filename, lineno, colno, err ) {
      if ( EditorR && EditorR.Ipc.sendToMain ) {
        EditorR.Ipc.sendToMain('editor:renderer-console-error', err.stack || err);
      } else {
        console.error(err.stack || err);
      }

      // Just let default handler run.
      return false;
    };

    // init document events

    // prevent default drag
    document.addEventListener( 'dragstart', event => {
      event.preventDefault();
      event.stopPropagation();
    });
    document.addEventListener( 'drop', event => {
      event.preventDefault();
      event.stopPropagation();
    });
    document.addEventListener( 'dragover', event => {
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = 'none';
    });

    // prevent contextmenu
    document.addEventListener( 'contextmenu', event => {
      event.preventDefault();
      event.stopPropagation();
    });

    // TODO: should we use webContents.clearHistory() instead?
    // prevent go back
    document.addEventListener( 'keydown', event => {
      if ( event.keyCode === 8 ) {
        if ( event.target === document.body ) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    });

    window.addEventListener('copy', event => {
      // the element can handle the copy event
      if ( event.target !== document.body ) {
        return;
      }

      // get current focused panel
      let focusedPanelFrame = EditorR.UI.focusedPanelFrame;
      if ( focusedPanelFrame ) {
        event.preventDefault();
        event.stopPropagation();

        EditorR.UI.fire(focusedPanelFrame, 'panel-copy', {
          bubbles: false,
          detail: {
            clipboardData: event.clipboardData,
          }
        });
      }
    });

    window.addEventListener('cut', event => {
      // the element can handle the copy event
      if ( event.target !== document.body ) {
        return;
      }

      // get current focused panel
      let focusedPanelFrame = EditorR.UI.focusedPanelFrame;
      if ( focusedPanelFrame ) {
        event.preventDefault();
        event.stopPropagation();

        EditorR.UI.fire(focusedPanelFrame, 'panel-cut', {
          bubbles: false,
          detail: {
            clipboardData: event.clipboardData,
          }
        });
      }
    });

    window.addEventListener('paste', event => {
      // the element can handle the copy event
      if ( event.target !== document.body ) {
        return;
      }

      // get current focused panel
      let focusedPanelFrame = EditorR.UI.focusedPanelFrame;
      if ( focusedPanelFrame ) {
        event.preventDefault();
        event.stopPropagation();

        EditorR.UI.fire(focusedPanelFrame, 'panel-paste', {
          bubbles: false,
          detail: {
            clipboardData: event.clipboardData,
          }
        });
      }
    });

    window.addEventListener('beforeunload', event => {
      let frameELs = EditorR.Panel.panels;
      let stopUnload = false;

      frameELs.forEach(el => {
        let result = true;
        if ( el.close ) {
          result = el.close();
        }

        if ( result === false ) {
          stopUnload = true;
        }
      });

      if ( stopUnload ) {
        event.returnValue = true;
      }
    });

    // DISABLE: looks like setting the `body: { overflow: hidden; }` will solve the problem
    // window.onload = function () {
    //     // NOTE: this will prevent mac touchpad scroll the body
    //     document.body.onscroll = function ( event ) {
    //         document.body.scrollLeft = 0;
    //         document.body.scrollTop = 0;
    //     };
    // };

    // DISABLE: I disable this because developer may debug during initialize,
    //          and when he refresh at that time, the layout will be saved and
    //          reloaded layout will not be the expected one
    // window.onunload = function () {
    //     if ( EditorR && EditorR.Panel ) {
    //         // NOTE: do not use DockUtils.saveLayout() which will be invoked in requestAnimationFrame.
    //         // It will not be called in window.onunload
    //         EditorR.Ipc.sendToMain(
    //           'editor:window-save-layout',
    //           EditorR.Panel.dumpLayout()
    //         );
    //     }
    //     else {
    //         EditorR.Ipc.sendToMain(
    //           'editor:window-save-layout',
    //           null
    //         );
    //     }
    // };

    // limit zooming
    Electron.webFrame.setZoomLevelLimits(1,1);

    // init & cache remote
    let _remoteEditor = Electron.remote.getGlobal('Editor');
    let _appPath = _remoteEditor.url('app://');
    let _frameworkPath = _remoteEditor.url('editor-framework://');

    // add builtin node_modules search path for page-level
    require('module').globalPaths.push(Path.join(_appPath,'node_modules'));

    // load editor-init.js
    EditorR = require(`${_frameworkPath}/lib/renderer`);
    EditorR.remote = _remoteEditor;

    // DISABLE: use hash instead
    // // init argument list sending from core by url?queries
    // // format: '?foo=bar&hell=world'
    // // skip '?'
    // let queryString = decodeURIComponent(location.search.substr(1));
    // let queryList = queryString.split('&');
    // let queries = {};
    // for ( let i = 0; i < queryList.length; ++i ) {
    //     let pair = queryList[i].split('=');
    //     if ( pair.length === 2) {
    //         queries[pair[0]] = pair[1];
    //     }
    // }
    // NOTE: hash is better than query from semantic, it means this is client data.
    if ( window.location.hash ) {
      let hash = window.location.hash.slice(1);
      EditorR.argv = Object.freeze(JSON.parse(decodeURIComponent(hash)));
    } else {
      EditorR.argv = {};
    }

    EditorR.dev = _remoteEditor.dev;
    EditorR.lang = _remoteEditor.lang;
    EditorR.appPath = _appPath;
    EditorR.frameworkPath = _frameworkPath;

    // config submodules
    EditorR.Ipc.debug = _remoteEditor.dev;

    // register protocol
    EditorR.Protocol.init(EditorR);
  } catch ( err ) {
    window.onload = function () {
      const Electron = require('electron');

      let currentWindow = Electron.remote.getCurrentWindow();
      currentWindow.setSize(800, 600);
      currentWindow.center();
      currentWindow.show();
      currentWindow.openDevTools();

      console.error(err.stack || err);
    };
  }
})();
