# Editor.Panel

Panel module for operating panels

## Methods

### Editor.Panel.close (panelID)

  - `panelID` String - The panelID.

Close a panel via `panelID`.

### Editor.Panel.closeAll (packageName)

  - `packageName` String - The package name.

Close all panels defined in package via `packageName`.

### Editor.Panel.findPanels (packageName)

  - `packageName` String - The package name.

Find and return panel ID list that contains panel defined in package via `packageName`.

### Editor.Panel.findWindow (panelID)

  - `panelID` String - The panelID.

Find and return an editor window that contains the panelID.

### Editor.Panel.findWindows (packageName)

  - `packageName` String - The package name.

Find and return editor window list that contains panel defined in package via `packageName`.

### Editor.Panel.open (panelID, argv)

  - `panelID` String - The panelID.
  - `argv` Object - Argument store as key-value table, which will be used in panel's `run` function in renderer process.

Open a panel via `panelID` and pass `argv` to it. The `argv` will be execute in panel's run function in renderer process.

## Properties

### templateUrl

The html entry file used for standalone panel window. Default is 'editor-framework://static/window.html'.

## IPC Messages

### Message: 'editor:panel-argv'

### Message: 'editor:panel-close'

### Message: 'editor:panel-dock'

### Message: 'editor:panel-open'

### Message: 'editor:panel-query-info'

### Message: 'editor:panel-wait-for-close'
