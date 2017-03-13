# Editor.Panel

## Methods

### Editor.Panel.close (panelID)

  - `panelID` String - The panel ID

Close a panel via `panelID`.

### Editor.Panel.dumpLayout ()

Dump the layout of the panels in current window.

### Editor.Panel.extend (proto)

  - `proto` Object

Extends a panel.

### Editor.Panel.find (panelID)

  - `panelID` String - The panel ID

Find panel frame via `panelID`.

### Editor.Panel.focus (panelID)

  - `panelID` String - The panel ID

Focus panel via `panelID`.

### Editor.Panel.getFocusedPanel ()

Get current focused panel.

### Editor.Panel.getPanelInfo (panelID)

  - `panelID` String - The panel ID

Get panel info via `panelID`.

### Editor.Panel.isDirty (panelID)

  - `panelID` String - The panel ID

Check if the specific panel is dirty.

### Editor.Panel.load (panelID, cb)

  - `panelID` String - The panel ID
  - `cb` Function

Load and create panel frame via `panelID`.

### Editor.Panel.open (panelID, argv)

  - `panelID` String - The panel ID
  - `argv`  Object

Open a panel via `panelID`.

### Editor.Panel.popup (panelID)

  - `panelID` String - The panel ID

Popup an exists panel via `panelID`.

### Editor.Panel.undock (panelID)

  - `panelID` String - The panel ID

Remove a panel element from document but do not close it.

### Editor.Panel.unload (panelID)

  - `panelID` String - The panel ID

Unload a panel via `panelID`.

## Properties

### Editor.Panel.panels

Get panels docked in current window.
