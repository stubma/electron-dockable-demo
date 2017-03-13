# Editor.Selection

## Methods

### Editor.Selection.register (type)

  - `type` String

### Editor.Selection.reset ()

### Editor.Selection.local ()

Returns a `Editor.Selection.ConfirmableSelectionHelper` instance. 

### Editor.Selection.confirm ()

Confirms all current selecting objects, no matter which type they are.
This operation may trigger deactivated and activated events.

### Editor.Selection.cancel ()

Cancels all current selecting objects, no matter which type they are.
This operation may trigger selected and unselected events.

### Editor.Selection.confirmed (type)

  - `type` String

Check if selection is confirmed.

### Editor.Selection.select (type, id[, unselectOthers, confirm])

  - `type` String
  - `id` String
  - `unselectOthers` Boolean
  - `confirm` Boolean

Select item with its id.

### Editor.Selection.unselect (type, id[, confirm])

  - `type` String
  - `id` String
  - `confirm` Boolean

Unselect item with its id.

### Editor.Selection.hover (type, id)

  - `type` String
  - `id` String

Hover item with its id. If id is null, it means hover out.

### Editor.Selection.setContext (type, id)

  - `type` String
  - `id` String

### Editor.Selection.patch (type, srcID, destID)

  - `type` String
  - `srcID` String
  - `destID` String

### Editor.Selection.clear (type)

  - `type` String

### Editor.Selection.hovering (type)

  - `type` String

### Editor.Selection.contexts (type)

  - `type` String

### Editor.Selection.curActivate (type)

  - `type` String

### Editor.Selection.curGlobalActivate (type)

  - `type` String

### Editor.Selection.curSelection (type)

  - `type` String

### Editor.Selection.filter (items, mode, func)

  - `items` Array(String)
  - `mode` String - 'top-level', 'deep' and 'name'
  - `func` Function
