# Detecting if your app goes online or offline

Electron already provides a way to detect online and offline events ---
[Online/Offline Event Detection](http://electron.atom.io/docs/tutorial/online-offline-events/)

Editor-Framework makes this even easier by wrapping it in a worker.

You can use it by putting the following code in your editor `init` phase:

```javascript
Editor.App.extend({
  init ( opts, cb ) {
    let worker = new Editor.Worker('online', {
      workerType: 'renderer',
      url: 'editor-framework://static/online-worker.html',
    });
    worker.on('editor:online-status-changed', ( event, status ) => {
      console.log(status);
    });
    worker.start(cb);
  },
});
```
