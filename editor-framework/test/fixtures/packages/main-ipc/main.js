'use strict';

module.exports = {
  load () {
  },

  unload () {
  },

  messages: {
    'say-hello' ( event ) {
      event.reply(null, 'hello');
    },

    'say-hello-02' ( event ) {
      event.reply(null, 'hello-02');
    },

    'another:say-hello-03' ( event ) {
      event.reply(null, 'hello-03');
    },
  }
};
