'use strict';

const CoreTest = require('./core/test');
const Test = require('./test');

module.exports = {
  load () {
  },

  unload () {
  },

  messages: {
    open () {
      Editor.Panel.open('main-deps');
    },
  }
};
