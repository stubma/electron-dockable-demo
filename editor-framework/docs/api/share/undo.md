# Editor.Undo

## Methods

### Editor.Undo.undo ()

### Editor.Undo.redo ()

### Editor.Undo.add (id, info)

  - `id` String
  - `info` Object

### Editor.Undo.commit ()

### Editor.Undo.cancel ()

### Editor.Undo.collapseTo (index)

  - `index` Number

### Editor.Undo.save ()

### Editor.Undo.clear ()

### Editor.Undo.reset ()

### Editor.Undo.dirty ()

### Editor.Undo.setCurrentDescription (desc)

  - `desc` String

### Editor.Undo.register (id, cmd)

  - `id` String
  - `cmd` Editor.Undo.Command

## Class: Editor.Undo.Command

## Instance Methods

### cmd.undo ()

### cmd.redo ()

### cmd.dirty ()
