'use strict';

let VueUtils = {};
module.exports = VueUtils;

VueUtils.init = function () {
  let Vue = window.Vue;

  // do nothing if we don't have Vue
  if ( !Vue ) {
    return;
  }

  // v-value
  Vue.directive('value', {
    twoWay: true,
    bind () {
      this.handler = event => {
        this.set(event.detail.value);
      };
      this.el.addEventListener('change', this.handler);
    },
    unbind () {
      this.el.removeEventListener('change', this.handler);
    },
    update (newValue) {
      this.el.value = newValue;
    },
  });

  // v-disabled
  Vue.directive('disabled', {
    update (newValue) {
      this.el.disabled = newValue;
    },
  });

  // v-readonly
  Vue.directive('readonly', {
    update (newValue) {
      this.el.readonly = newValue;
    },
  });
};
