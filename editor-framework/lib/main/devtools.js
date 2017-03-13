'use strict';

/**
 * @module Editor.DevTools
 */
let DevTools = {
  /**
   * @method focus
   * @param {Editor.Window} editorWin
   *
   * Focus on devtools for `editorWin`
   */
  focus ( editorWin ) {
    editorWin.openDevTools();
    if ( editorWin.nativeWin.devToolsWebContents ) {
      editorWin.nativeWin.devToolsWebContents.focus();
    }
  },

  /**
   * @method executeJavaScript
   * @param {Editor.Window} editorWin
   * @param {script} script
   *
   * Execute `script` in the devtools for `editorWin`
   */
  executeJavaScript ( editorWin, script ) {
    editorWin.openDevTools();
    if ( editorWin.nativeWin.devToolsWebContents ) {
      editorWin.nativeWin.devToolsWebContents.executeJavaScript(script);
    }
  },

  /**
   * @method enterInspectElementMode
   * @param {Editor.Window} editorWin
   *
   * Enter the inspect element mode for `editorWin`
   */
  enterInspectElementMode ( editorWin ) {
    DevTools.executeJavaScript(
      editorWin,
      'DevToolsAPI.enterInspectElementMode()'
    );
  },
};

module.exports = DevTools;
