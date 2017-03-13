'use strict';

let Props = {};
module.exports = Props;

// ==========================
// internal
// ==========================

const Utils = require('./utils');
const PropElement = require('./prop');
const DomUtils = require('../utils/dom-utils');

let parseString = Utils.parseString;
let parseBoolean = Utils.parseBoolean;
let parseColor = Utils.parseColor;
let parseArray = Utils.parseArray;

// ==========================
// export
// ==========================

// string
Props.string = {
  value: parseString,

  attrs: {
    multiline: parseBoolean,
  },

  template ( attrs ) {
    let tmpl;
    if ( attrs.multiline ) {
      tmpl = `
        <ui-text-area class="flex-1" resize-v></ui-text-area>
      `;
    } else {
      tmpl = `
        <ui-input class="flex-1"></ui-input>
      `;
    }
    return tmpl;
  },

  ready () {
    if ( this.attrs.multiline ) {
      this.autoHeight = true;
    }
    this.$input = this.children[0];
    this.$input.value = this.value;

    this.installStandardEvents(this.$input);
  },

  inputValue () {
    return this.$input.value;
  },

  attrsChanged ( oldAttrs, newAttrs ) {
    if ( newAttrs.multiline !== oldAttrs.multiline ) {
      this.regen();
      return;
    }
  },

  valueChanged ( oldVal, newVal ) {
    this.$input.value = newVal;
  },
};

// number
Props.number = {
  value: parseFloat,

  attrs: {
    'input-type': parseString,
    slide: parseBoolean,
    min: parseFloat,
    max: parseFloat,
    step: parseFloat,
    precision: parseInt,
  },

  template ( attrs ) {
    let tmpl;
    if ( attrs.slide ) {
      tmpl = `
        <ui-slider class="flex-1"></ui-slider>
      `;
    } else {
      tmpl = `
        <ui-num-input class="flex-1"></ui-num-input>
      `;
    }
    return tmpl;
  },

  ready () {
    this.slidable = true;
    this.$input = this.children[0];

    this.$input.type = this.attrs['input-type'];
    this.$input.min = this.attrs.min;
    this.$input.max = this.attrs.max;
    this.$input.step = this.attrs.step;
    this.$input.precision = this.attrs.precision;

    this.$input.value = this.value;

    this.installStandardEvents(this.$input);
    this.installSlideEvents(
      this,
      dx => {
        this.$input.value = this.$input.value + dx * this.$input.step;
      },
      null,
      () => {
        this.$input.value = this.value;
      }
    );
  },

  inputValue () {
    return this.$input.value;
  },

  attrsChanged ( oldAttrs, newAttrs ) {
    if ( oldAttrs.slide !== newAttrs.slide ) {
      this.regen();
      return;
    }

    this.$input.type = newAttrs['input-type'];
    this.$input.min = newAttrs.min;
    this.$input.max = newAttrs.max;
    this.$input.step = newAttrs.step;
    this.$input.precision = newAttrs.precision;
  },

  valueChanged ( oldVal, newVal ) {
    this.$input.value = newVal;
  },
};

// boolean
Props.boolean = {
  value: txt => {
    if ( txt === 'false' || txt === '0' ) {
      return false;
    }
    if ( txt === 'true' ) {
      return true;
    }
    return txt !== null;
  },

  template: `
    <ui-checkbox class="flex-1"></ui-checkbox>
  `,

  ready () {
    this.$input = this.children[0];
    this.$input.value = this.value;

    this.installStandardEvents(this.$input);
  },

  inputValue () {
    return this.$input.value;
  },

  valueChanged ( oldVal, newVal ) {
    this.$input.value = newVal;
  },
};

// object
Props.object = {
  value: txt => {
    return JSON.parse(txt);
  },

  template: `
    <div class="child"></div>
  `,

  ready () {
    this.foldable = true;
    this.$child = this.querySelector('.child');

    let obj = this.value;
    for ( let name in obj ) {
      let childVal = obj[name];
      let childProp = new PropElement( name, childVal, null, null,  this.indent+1 );
      this.$child.appendChild(childProp);
    }
  },

  valueChanged () {
    // TODO: diff newValue, oldValue
    this.regen();
  },

  addProp (el) {
    this.$child.appendChild(el);
  },
};

// array
Props.array = {
  value: parseArray,

  template: `
    <ui-num-input class="flex-1"></ui-num-input>
    <div class="child"></div>
  `,

  ready () {
    this.foldable = true;
    this.$input = this.children[0];
    this.$child = this.querySelector('.child');

    this.$input.value = this.value.length;
    this._updateChildren();

    this.$input.addEventListener('confirm', () => {
      this.value.length = this.$input.value;
      this._emitConfirm();
    });
  },

  valueChanged ( oldVal, newVal ) {
    this.$input.value = newVal.length;
    this._updateChildren();
  },

  _updateChildren () {
    DomUtils.clear(this.$child);

    for ( let i = 0; i < this.value.length; ++i ) {
      let child = this.value[i];
      let childProp = new PropElement(
        `[${i}]`,
        child.value,
        this.type,
        this.attrs,
        this.indent+1
      );
      childProp.movable = true;
      childProp.removable = true;
      this.$child.appendChild(childProp);
    }
  }
};

// enum
Props.enum = {
  hasUserContent: true,

  value: parseInt,

  attrs: {
    options: parseArray,
  },

  template: `
    <ui-select class="flex-1"></ui-select>
  `,

  ready ( content ) {
    this.$input = this.querySelector('ui-select');
    this.installStandardEvents(this.$input);

    if ( this.attrs && this.attrs.options ) {
      this.attrs.options.forEach(opt => {
        this.addItem( opt.value, opt.name );
      });
      this.$input.value = this.value;

    } else if ( content ) {
      content.forEach(el => {
        this.$input.addElement(el);
      });
      this.$input.value = this.value;

    } else {
      this.$input.value = this.value;
    }
  },

  inputValue () {
    return this.$input.value;
  },

  valueChanged ( oldVal, newVal ) {
    this.$input.value = newVal;
  },

  addItem ( value, text ) {
    this.$input.addItem( value, text );
  },
};

// color
Props.color = {
  value: parseColor,

  template: `
    <ui-color class="flex-1"></ui-color>
  `,

  ready () {
    this.$input = this.children[0];
    this.$input.value = this.value;

    this.installStandardEvents(this.$input);
  },

  inputValue () {
    return this.$input.value;
  },

  valueChanged ( oldVal, newVal ) {
    this.$input.value = newVal;
  },
};

// vec2
Props.vec2 = {
  value: parseArray,

  template: `
    <ui-prop name="X" id="x-comp" slidable class="fixed-label red flex-1">
      <ui-num-input class="flex-1"></ui-num-input>
    </ui-prop>
    <ui-prop name="Y" id="y-comp" slidable class="fixed-label green flex-1">
      <ui-num-input class="flex-1"></ui-num-input>
    </ui-prop>
  `,

  ready () {
    // x-comp
    this.$propX = this.querySelector('#x-comp');
    this.$inputX = this.$propX.children[0];
    if ( this.value ) {
      this.$inputX.value = this.value[0];
    }

    this.installStandardEvents(this.$inputX);
    this.installSlideEvents(
      this.$propX,
      dx => {
        this.$inputX.value = this.$inputX.value + dx;
      },
      null,
      () => {
        this.$inputX.value = this.value[0];
      }
    );

    // y-comp
    this.$propY = this.querySelector('#y-comp');
    this.$inputY = this.$propY.children[0];
    if ( this.value ) {
      this.$inputY.value = this.value[1];
    }

    this.installStandardEvents(this.$inputY);
    this.installSlideEvents(
      this.$propY,
      dx => {
        this.$inputY.value = this.$inputY.value + dx;
      },
      null,
      () => {
        this.$inputY.value = this.value[1];
      }
    );
  },

  inputValue () {
    return [this.$inputX.value, this.$inputY.value];
  },

  valueChanged ( oldVal, newVal ) {
    this.$inputX.value = newVal[0];
    this.$inputY.value = newVal[1];
  },
};

// vec3
Props.vec3 = {
  value: parseArray,

  template: `
    <ui-prop name="X" id="x-comp" slidable class="fixed-label red flex-1">
      <ui-num-input class="flex-1"></ui-num-input>
    </ui-prop>
    <ui-prop name="Y" id="y-comp" slidable class="fixed-label green flex-1">
      <ui-num-input class="flex-1"></ui-num-input>
    </ui-prop>
    <ui-prop name="Z" id="z-comp" slidable class="fixed-label blue flex-1">
      <ui-num-input class="flex-1"></ui-num-input>
    </ui-prop>
  `,

  ready () {
    // x-comp
    this.$propX = this.querySelector('#x-comp');
    this.$inputX = this.$propX.children[0];
    if ( this.value ) {
      this.$inputX.value = this.value[0];
    }

    this.installStandardEvents(this.$inputX);
    this.installSlideEvents(
      this.$propX,
      dx => {
        this.$inputX.value = this.$inputX.value + dx;
      },
      null,
      () => {
        this.$inputX.value = this.value[0];
      }
    );

    // y-comp
    this.$propY = this.querySelector('#y-comp');
    this.$inputY = this.$propY.children[0];
    if ( this.value ) {
      this.$inputY.value = this.value[1];
    }

    this.installStandardEvents(this.$inputY);
    this.installSlideEvents(
      this.$propY,
      dx => {
        this.$inputY.value = this.$inputY.value + dx;
      },
      null,
      () => {
        this.$inputY.value = this.value[1];
      }
    );

    // z-comp
    this.$propZ = this.querySelector('#z-comp');
    this.$inputZ = this.$propZ.children[0];
    if ( this.value ) {
      this.$inputZ.value = this.value[2];
    }

    this.installStandardEvents(this.$inputZ);
    this.installSlideEvents(
      this.$propZ,
      dx => {
        this.$inputZ.value = this.$inputZ.value + dx;
      },
      null,
      () => {
        this.$inputZ.value = this.value[2];
      }
    );
  },

  inputValue () {
    return [this.$inputX.value, this.$inputY.value, this.$inputZ.value];
  },

  valueChanged ( oldVal, newVal ) {
    this.$inputX.value = newVal[0];
    this.$inputY.value = newVal[1];
    this.$inputZ.value = newVal[2];
  },
};
