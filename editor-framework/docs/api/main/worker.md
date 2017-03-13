# Editor.Worker

## Class: Editor.Worker

### new Editor.Worker (name[, options])

  - `name` String - The worker name.
  - `options` Object
    - `workerType` String - Can be one of the list:
      - `renderer`: Indicate the worker is running in a hidden window
      - `main`: Indicate the worker is running is a process
    - `url` String - The url of renderer worker.

## Instance Methdos

### worker.close ()

Close the worker.

### worker.dispose ()

Dereference the native window.

### worker.on (message[, ...args])

  - `message` String
  - `...args` ... - Whatever arguments the message needs.

### worker.start (argv, cb)

  - `argv` Object - The arguments
  - `cb` Function - The callback function

Starts the worker.
