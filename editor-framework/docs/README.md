This section explains how to extend Editor-Framework by creating and modifying packages with the [Editor-Framework](https://github.com/cocos-creator/editor-framework) API.

## FAQ

## Manual

  - Getting Started
    - [Defining Your App](manual/getting-started/defining-your-app.md)
    - [App Lifecycle and Events](manual/getting-started/app-lifecycle-and-events.md)
    - [Introduction to IPC](manual/getting-started/introduction-to-ipc.md)
  - Writing A Package
    - [Creating A Package](manual/packages/creating-a-package.md)
    - [Extending Main Menu](manual/packages/extending-main-menu.md)
    - [Creating Panels](manual/packages/creating-panels.md)
    - [Panel Frame Reference](manual/packages/panel-frame-reference.md)
    - [Registering Shortcuts](manual/packages/register-shortcuts.md)
    - [i18n](manual/packages/i18n.md)
    - [Creating Single Page Panel](manual/packages/creating-single-page-panel.md)
    - [Loading and Building Packages](manual/packages/load-and-build-packages.md) **out of date & deprecated**
  - Customize Your Application
    - [Editor Configuration](manual/customization/editor-configuration.md)
    - Default Layout **todo**
    - Custom Commands **todo**
    - [Custom Protocol](manual/customization/custom-protocol.md)
  - UI Programming
    - [Writing UI for Panel](manual/ui/writing-ui-for-panel.md)
    - [Using UI Kit](manual/ui/using-ui-kit.md) **todo**
    - [Focusable Module](manual/ui/focusable.md)
    - [UI Layout](manual/ui/ui-layout.md)
  - Work With Vue
    - Creating Vue Panels **todo**
  - Work With Polymer
    - [Polymer Primer](manual/polymer/polymer-primer.md) **deprecated**
    - [Creating Polymer Panels](manual/polymer/create-polymer-panels.md) **deprecated**
    - [Creating Polymer Element](manual/polymer/create-polymer-element.md) **deprecated**
    - [Event Binding](manual/polymer/event-binding.md) **deprecated**
  - Misc
    - [Online/Offline Event Detection](manual/misc/online-offline-events.md)

## API

### Modules for the Main Process

  - [Editor](api/main/editor.md)
  - [Editor (Console Module)](api/main/console.md)
  - [Editor.App](api/main/app.md)
  - [Editor.Debugger](api/main/debugger.md)
  - [Editor.DevTools](api/main/devtools.md)
  - [Editor.Dialog](api/main/dialog.md)
  - [Editor.Ipc](api/main/ipc.md)
  - [Editor.MainMenu](api/main/main-menu.md)
  - [Editor.Menu](api/main/menu.md)
  - [Editor.Package](api/main/package.md)
  - [Editor.Panel](api/main/panel.md)
  - [Editor.Profile](api/main/profile.md)
  - [Editor.Protocol](api/main/protocol.md)
  - [Editor.Window](api/main/window.md)
  - [Editor.Worker](api/main/worker.md)

### Modules for the Renderer Process (Web Page)

  - [Editor](api/renderer/editor.md)
  - [Editor (Console Module)](api/renderer/console.md)
  - [Editor.Audio](api/renderer/audio.md)
  - [Editor.Dialog](api/renderer/dialog.md)
  - [Editor.Ipc](api/renderer/ipc.md)
  - [Editor.MainMenu](api/renderer/main-menu.md)
  - [Editor.Menu](api/renderer/menu.md)
  - [Editor.Package](api/renderer/package.md)
  - [Editor.Panel](api/renderer/panel.md)
  - [Editor.Protocol](api/renderer/protocol.md)
  - [Editor.Window](api/renderer/window.md)
  - Editor.UI
    - [Editor.UI (DOM Utils Module)](api/renderer/ui/dom-utils.md)
    - [Editor.UI (Element Utils Module)](api/renderer/ui/element-utils.md)
    - [Editor.UI (Focus Module)](api/renderer/ui/focus-mgr.md)
    - [Editor.UI (Resources Module)](api/renderer/ui/resource-mgr.md)
    - [Editor.UI.Settings](api/renderer/ui/settings.md)
    - Utils
      - [Editor.UI.DockUtils](api/renderer/ui/dock-utils.md)
      - [Editor.UI.DragDrop](api/renderer/ui/drag-drop.md)
    - Behaviors
      - [Editor.UI.ButtonState](api/renderer/ui/behaviors/button-state.md) **todo**
      - [Editor.UI.Disable](api/renderer/ui/behaviors/disable.md) **todo**
      - [Editor.UI.Dockable](api/renderer/ui/behaviors/dockable.md) **todo**
      - [Editor.UI.Droppable](api/renderer/ui/behaviors/droppable.md) **todo**
      - [Editor.UI.Focusable](api/renderer/ui/behaviors/focusable.md) **todo**
      - [Editor.UI.InputState](api/renderer/ui/behaviors/input-state.md) **todo**
      - [Editor.UI.Readonly](api/renderer/ui/behaviors/readonly.md) **todo**
      - [Editor.UI.Resizable](api/renderer/ui/behaviors/resizable.md) **todo**
    - Dock Element
      - [Editor.UI.DockResizer](api/renderer/ui/dock/dock-resizer.md) **todo**
      - [Editor.UI.Dock](api/renderer/ui/dock/dock.md) **todo**
      - [Editor.UI.MainDock](api/renderer/ui/dock/main-dock.md) **todo**
      - [Editor.UI.Tab](api/renderer/ui/dock/tab.md) **todo**
      - [Editor.UI.Tabs](api/renderer/ui/dock/tabs.md) **todo**
      - [Editor.UI.Panel](api/renderer/ui/dock/panel.md) **todo**
      - [Editor.UI.PanelFrame](api/renderer/ui/dock/panel-frame.md) **todo**
    - UI Element
      - [Editor.UI.BoxContainer](api/renderer/ui/elements/box-container.md) **todo**
      - [Editor.UI.Button](api/renderer/ui/elements/button.md) **todo**
      - [Editor.UI.Checkbox](api/renderer/ui/elements/checkbox.md) **todo**
      - [Editor.UI.Color](api/renderer/ui/elements/color.md) **todo**
      - [Editor.UI.ColorPicker](api/renderer/ui/elements/color-picker.md) **todo**
      - [Editor.UI.Hint](api/renderer/ui/elements/hint.md) **todo**
      - [Editor.UI.Input](api/renderer/ui/elements/input.md) **todo**
      - [Editor.UI.Loader](api/renderer/ui/elements/loader.md) **todo**
      - [Editor.UI.Markdown](api/renderer/ui/elements/markdown.md) **todo**
      - [Editor.UI.NumInput](api/renderer/ui/elements/num-input.md) **todo**
      - [Editor.UI.Progress](api/renderer/ui/elements/progress.md) **todo**
      - [Editor.UI.Prop](api/renderer/ui/elements/prop.md) **todo**
      - [Editor.UI.Section](api/renderer/ui/elements/section.md) **todo**
      - [Editor.UI.Select](api/renderer/ui/elements/select.md) **todo**
      - [Editor.UI.Shadow](api/renderer/ui/elements/shadow.md) **todo**
      - [Editor.UI.Slider](api/renderer/ui/elements/slider.md) **todo**
      - [Editor.UI.TextArea](api/renderer/ui/elements/text-area.md) **todo**
      - [Editor.UI.WebView](api/renderer/ui/elements/webview.md) **todo**

### Modules for Both Processes

  - [Editor](api/share/editor.md)
  - [Editor.Easing](api/share/easing.md)
  - [Editor.IpcListener](api/share/ipc-listener.md)
  - [Editor.JS](api/share/js-utils.md)
  - [Editor.Math](api/share/math.md)
  - [Editor.Selection](api/share/selection.md)
  - [Editor.Undo](api/share/undo.md)
  - [Editor.Utils](api/share/utils.md)
  - [Editor.i18n](api/share/i18n.md)

## Development

  - [Running Tests](development/running-tests.md)
  - [Writing Tests](development/writing-tests.md)
  - [Debugging the Main Process](development/debug-main-process.md)
