'use strict';

/**
 * @module Editor
 */

let Platform = {};
module.exports = Platform;

// ==========================
// exports
// ==========================

/**
 * @property isNode
 * @type boolean
 *
 * Indicates whether executes in node.js application
 */
Platform.isNode = !!(typeof process !== 'undefined' && process.versions && process.versions.node);

/**
 * @property isElectron
 * @type boolean
 *
 * Indicates whether executes in electron
 */
Platform.isElectron = !!(Platform.isNode && ('electron' in process.versions));

/**
 * @property isNative
 * @type boolean
 *
 * Indicates whether executes in native environment (compare to web-browser)
 */
Platform.isNative = Platform.isElectron;

/**
 * @property isPureWeb
 * @type boolean
 *
 * Indicates whether executes in common web browser
 */
Platform.isPureWeb = !Platform.isNode && !Platform.isNative; // common web browser

/**
 * @property isRendererProcess
 * @type boolean
 *
 * Indicates whether executes in common web browser, or editor's renderer process(web-page)
 */
if (Platform.isElectron) {
  Platform.isRendererProcess = typeof process !== 'undefined' && process.type === 'renderer';
} else {
  Platform.isRendererProcess = (typeof __dirname === 'undefined' || __dirname === null);
}

/**
 * @property isMainProcess
 * @type boolean
 *
 * Indicates whether executes in editor's main process
 */
Platform.isMainProcess = typeof process !== 'undefined' && process.type === 'browser';

if (Platform.isNode) {
  /**
   * @property isDarwin
   * @type boolean
   *
   * Indicates whether executes in OSX
   */
  Platform.isDarwin = process.platform === 'darwin';

  /**
   * @property isWin32
   * @type boolean
   *
   * Indicates whether executes in Windows
   */
  Platform.isWin32 = process.platform === 'win32';
} else {
  // http://stackoverflow.com/questions/19877924/what-is-the-list-of-possible-values-for-navigator-platform-as-of-today
  let platform = window.navigator.platform;
  Platform.isDarwin = platform.substring(0, 3) === 'Mac';
  Platform.isWin32 = platform.substring(0, 3) === 'Win';
}


/**
 * @property isRetina
 * @type boolean
 *
 * Check if running in retina display
 */
Object.defineProperty(Platform, 'isRetina', {
  enumerable: true,
  get () {
    return Platform.isRendererProcess && window.devicePixelRatio && window.devicePixelRatio > 1;
  }
});
