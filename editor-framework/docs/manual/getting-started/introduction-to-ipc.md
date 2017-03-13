# Main and Renderer Process

Like Electron, an Editor-Framework appication consists primarily of two types of processes:

- Main Process: Creates window and web pages. Also shares data among renderer processes.
- Renderer Process: Renders HTML web pages and runs client-side JavaScript. Each window runs within a separate renderer process.

Put simply, the main process acts like a node.js server, and the renderer process acts like JavaScript loaded from the web client. To better understand these two types of processes, read [Electron's introduction document](http://electron.atom.io/docs/tutorial/quick-start/).

In short, an Editor-Framework application starts from the main process, and can have several renderer processes (windows) running on top of it.

## Inter-Process Communication (IPC)

Each process has its own JavaScript context and cannot directly access the memory data from other processes. To exchange information, messages must be sent by one process and listened for in the target process. Messages are identified by a string identifier of your choosing. Also known as inter-process communication (IPC).

Electron provides two IPC modules [ipcMain](http://electron.atom.io/docs/api/ipc-main/) and [ipcRenderer](http://electron.atom.io/docs/api/ipc-renderer/) to provide communication between the main and renderer processes. Editor-Framework encapsulates them to simplify more complex use cases.

## IPC Message Identifier

IPC messages consist of a short identifier string and a number of parameters which can be passed along with the message. Once sent by the sender, a receiver in a separate process listens for that identifier string and executes a callback for that action, passing the relevant message parameters as arguments to the callback.

For readability, we recommend that you scope an IPC message identifier to the module or package it belongs to:

```javascript
'module-name:action-name'
// or
'package-name:action-name'
```

Basically, you can use any string as message identifier, but we strongly recommend you use your package name (if you are sending message in your package) or module name (if you are handling sub-module tasks) with a colon to make a message identifier.

Let's see it in action:

```javascript
'app:save-file'
```

The `app` scope indicates that this message is an application-level task, `save-file` is the action to be performed.

Here is another example:

```javascript
'my-simple-package:query-user-info'
```

The `my-simple-package` is the your package name, and `query-user-info` is the action to be performed.
