'use strict';

(() => {
  // only window open with panelID needs send request
  if ( Editor.argv.panelID ) {
    Editor.Panel.load(Editor.argv.panelID, ( err, frameEL, panelInfo ) => {
      if ( err ) {
        Editor.error(err.stack);
        return;
      }

      if ( panelInfo.type === 'dockable' ) {
        let dockEL = document.createElement('ui-dock');
        dockEL.noCollapse = true;
        dockEL.classList.add('fit');

        let panelEL = document.createElement('ui-dock-panel');
        panelEL.add(frameEL);
        panelEL.select(0);

        dockEL.appendChild(panelEL);
        document.body.appendChild(dockEL);

        Editor.UI.DockUtils.root = dockEL;
      } else {
        document.body.appendChild(frameEL);

        Editor.UI.DockUtils.root = frameEL;
      }

      //
      Editor.UI.DockUtils.reset();

      // save layout after css layouted
      Editor.UI.DockUtils.saveLayout();

      //
      Editor.Ipc.sendToMain('editor:panel-argv', Editor.argv.panelID, (err,argv) => {
        if ( frameEL.run ) {
          frameEL.run(argv);
        }
      });
    });
  }
})();
