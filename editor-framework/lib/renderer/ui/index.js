'use strict';

/**
 * @module Editor.UI
 */
let UI = {};
module.exports = UI;

UI.Settings = require('./settings');

UI._DomUtils = require('./utils/dom-utils'); // for DEBUG & TEST
UI._FocusMgr = require('./utils/focus-mgr'); // for DEBUG & TEST
UI._ResMgr = require('./utils/resource-mgr'); // for DEBUG & TEST

UI.DockUtils = require('./utils/dock-utils');
UI.DragDrop = require('./utils/drag-drop');

UI.Resizable = require('./behaviors/resizable');
UI.Droppable = require('./behaviors/droppable');
UI.Dockable = require('./behaviors/dockable');
UI.Focusable = require('./behaviors/focusable');
UI.Disable = require('./behaviors/disable');
UI.Readonly = require('./behaviors/readonly');
UI.ButtonState = require('./behaviors/button-state');
UI.InputState = require('./behaviors/input-state');

// dock elements
UI.DockResizer = require('./dock/resizer');
UI.Dock = require('./dock/dock');
UI.MainDock = require('./dock/main-dock');
UI.Tab = require('./panel/tab');
UI.Tabs = require('./panel/tabs');
UI.Panel = require('./panel/panel');
UI.PanelFrame = require('./panel/frame');

// mixin to UI

const JS = require('../../share/js-utils');

// ====================
// DomUtils
// ====================

JS.assign(UI, UI._DomUtils);

// ====================
// ResMgr
// ====================

JS.assign(UI, UI._ResMgr);

// ====================
// FocusMgr
// ====================

/**
 * @method focus
 * @param {HTMLElement} element
 *
 * Focus on specific `element`
 */
UI.focus = UI._FocusMgr._setFocusElement;

/**
 * @method focusParent
 * @param {HTMLElement} element
 *
 * Focus on the parent of `element`
 */
UI.focusParent = UI._FocusMgr._focusParent;

/**
 * @method focusNext
 *
 * Focus on the next element
 */
UI.focusNext = UI._FocusMgr._focusNext;

/**
 * @method focusPrev
 *
 * Focus on the previous element
 */
UI.focusPrev = UI._FocusMgr._focusPrev;

/**
 * @property lastFocusedPanelFrame
 *
 * The last focused panel frame
 */
JS.copyprop('lastFocusedPanelFrame', UI._FocusMgr, UI);

/**
 * @property focusedPanelFrame
 *
 * Current focused panel frame
 */
JS.copyprop('focusedPanelFrame', UI._FocusMgr, UI);

/**
 * @property lastFocusedElement
 *
 * The last focused element
 */
JS.copyprop('lastFocusedElement', UI._FocusMgr, UI);

/**
 * @property focusedElement
 *
 * Current focused element
 */
JS.copyprop('focusedElement', UI._FocusMgr, UI);

// ====================
// Element Utils
// ====================

JS.assign(UI, require('./elements/utils'));

// load and cache css
UI.importStylesheets([
  // dock elements
  'theme://elements/resizer.css',
  'theme://elements/tab.css',
  'theme://elements/tabs.css',
  'theme://elements/dock.css',
  'theme://elements/panel.css',
  'theme://elements/panel-frame.css',

  // ui elements
  'theme://elements/box-container.css',
  'theme://elements/button.css',
  'theme://elements/checkbox.css',
  'theme://elements/color-picker.css',
  'theme://elements/color.css',
  'theme://elements/hint.css',
  'theme://elements/input.css',
  'theme://elements/loader.css',
  'theme://elements/markdown.css',
  'theme://elements/num-input.css',
  'theme://elements/progress.css',
  'theme://elements/prop.css',
  'theme://elements/section.css',
  'theme://elements/select.css',
  'theme://elements/slider.css',
  'theme://elements/text-area.css',
]).then(() => {
  // registry dock elements
  [
    UI.DockResizer,
    UI.Dock,
    UI.MainDock,
    UI.Tab,
    UI.Tabs,
    UI.Panel,
    UI.PanelFrame,
  ].forEach(cls => {
    document.registerElement(cls.tagName, cls);
  });

  // register ui elements
  UI.BoxContainer = require('./elements/box-container');
  UI.Button = require('./elements/button');
  UI.Checkbox = require('./elements/checkbox');
  UI.Color = require('./elements/color');
  UI.ColorPicker = require('./elements/color-picker');
  UI.Hint = require('./elements/hint');
  UI.Input = require('./elements/input');
  UI.Loader = require('./elements/loader');
  UI.Markdown = require('./elements/markdown');
  UI.NumInput = require('./elements/num-input');
  UI.Progress = require('./elements/progress');
  UI.Prop = require('./elements/prop');
  UI.Section = require('./elements/section');
  UI.Select = require('./elements/select');
  UI.Slider = require('./elements/slider');
  UI.TextArea = require('./elements/text-area');

  // register builtin props
  const Props = require('./elements/props');
  // UI.registerProperty('undefined', Props.undef);
  [
    'string',
    'number',
    'boolean',
    'array',
    'object',
    'enum',
    'color',
    'vec2',
    'vec3',
  ].forEach(name => {
    UI.registerProperty(name, Props[name]);
  });

  // register special ui elements
  UI.Shadow = require('./elements/shadow');
  UI.WebView = require('./elements/webview');
});

document.onreadystatechange = () => {
  if ( document.readyState === 'interactive' ) {
    const Path = require('fire-path');

    // NOTE: we don't use url such as theme://globals/common.css
    // that will cause a crash if we frequently open and close window
    const dir = Editor.url('theme://globals');
    const cssList = [
      // common header
      Path.join(dir,'common.css'),
      Path.join(dir,'layout.css'),
    ];
    cssList.forEach(url => {
      let link = document.createElement('link');
      link.setAttribute( 'type', 'text/css' );
      link.setAttribute( 'rel', 'stylesheet' );
      link.setAttribute( 'href', url );

      document.head.insertBefore(link, document.head.firstChild);
    });
  }
};

// 3rd
UI.VueUtils = require('./utils/vue-utils');
UI.PolymerUtils = require('./utils/polymer-utils');
UI.PolymerFocusable = require('./behaviors/polymer-focusable');
