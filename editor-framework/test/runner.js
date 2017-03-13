'use strict';

require('../index');

Editor.App.extend({
  init ( opts, cb ) {
    Editor.init();

    if ( cb ) {
      cb ();
    }
  },
});
