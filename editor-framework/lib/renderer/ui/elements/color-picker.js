'use strict';

const Electron = require('electron');
const Chroma = require('chroma-js');

const Menu = Electron.remote.Menu;
const MenuItem = Electron.remote.MenuItem;

const ElementUtils = require('./utils');
const MathUtils = require('../../../share/math');
const ResMgr = require('../utils/resource-mgr');
const DomUtils = require('../utils/dom-utils');
const FocusMgr = require('../utils/focus-mgr');
const Focusable = require('../behaviors/focusable');

module.exports = ElementUtils.registerElement('ui-color-picker', {
  get value () { return this._value; },
  set value (val) {
    let rgba = Chroma(val).rgba();
    if ( rgba !== this._value ) {
      this._value = rgba;
      this._lastAssigned = rgba.slice(0);

      this._updateColorDiff();
      this._updateHue();
      this._updateAlpha();
      this._updateColor();
      this._updateSliders();
      this._updateHexInput();
    }
  },

  behaviors: [ Focusable ],

  template: `
    <div class="hbox">
      <div class="hue ctrl" tabindex="-1">
        <div class="hue-handle">
          <i class="icon-right-dir"></i>
        </div>
      </div>
      <div class="color ctrl" tabindex="-1">
        <div class="color-handle">
          <i class="icon-circle-empty"></i>
        </div>
      </div>
      <div class="alpha ctrl" tabindex="-1">
        <div class="alpha-handle">
          <i class="icon-left-dir"></i>
        </div>
      </div>
    </div>

    <div class="vbox">
      <div class="prop">
        <span class="red tag">R</span>
        <ui-slider id="r-slider" step=1 precision=0 min=0 max=255></ui-slider>
      </div>
      <div class="prop">
        <span class="green">G</span>
        <ui-slider id="g-slider" step=1 precision=0 min=0 max=255></ui-slider>
      </div>
      <div class="prop">
        <span class="blue">B</span>
        <ui-slider id="b-slider" step=1 precision=0 min=0 max=255></ui-slider>
      </div>
      <div class="prop">
        <span class="gray">A</span>
        <ui-slider id="a-slider" step=1 precision=0 min=0 max=255></ui-slider>
      </div>
      <div class="hex-field">
        <div class="color-block old">
          <div id="old-color" class="color-inner"></div>
        </div>
        <div class="color-block new">
          <div id="new-color" class="color-inner"></div>
        </div>
        <span class="space"></span>
        <div class="label">Hex Color</div>
        <ui-input id="hex-input"></ui-input>
      </div>
    </div>

    <div class="title">
      <div>Presets</div>
      <ui-button id="btn-add" class="transparent tiny">
        <i class="icon-plus"></i>
      </ui-button>
    </div>
    <div class="hbox palette"></div>
  `,

  style: ResMgr.getResource('theme://elements/color-picker.css'),

  $: {
    hueHandle: '.hue-handle',
    colorHandle: '.color-handle',
    alphaHandle: '.alpha-handle',

    hueCtrl: '.hue.ctrl',
    colorCtrl: '.color.ctrl',
    alphaCtrl: '.alpha.ctrl',

    sliderR: '#r-slider',
    sliderG: '#g-slider',
    sliderB: '#b-slider',
    sliderA: '#a-slider',

    newColor: '#new-color',
    oldColor: '#old-color',
    hexInput: '#hex-input',
    colorPresets: '.color-box',

    btnAdd: '#btn-add',
    palette: '.palette',
  },

  factoryImpl (color) {
    if ( color ) {
      this.value = color;
    }
  },

  ready () {
    // init _value
    let value = this.getAttribute('value');
    if ( value !== null ) {
      this._value = Chroma(value).rgba();
    } else {
      this._value = [255,255,255,1];
    }
    this._lastAssigned = this._value.slice(0);

    // init settings
    let settings = window.localStorage['ui-color-picker'];
    if ( settings ) {
      this._settings = JSON.parse(settings);
    } else {
      this._settings = {
        colors: []
      };
    }

    // init palette
    this._initPalette();

    // update control
    this._updateColorDiff();
    this._updateHue();
    this._updateColor();
    this._updateAlpha();
    this._updateSliders();
    this._updateHexInput();

    //
    this._initFocusable(this);

    //
    this._initEvents();
  },

  hide ( confirm ) {
    DomUtils.fire(this, 'hide', {
      bubbles: false,
      detail: {
        confirm: confirm,
      }
    });
  },

  _initEvents () {
    this.addEventListener('keydown', event => {
      // if space or enter, hide for confirm
      if (
        event.keyCode === 13 ||
        event.keyCode === 32
      ) {
        DomUtils.acceptEvent(event);
        this.hide(true);
      }
      // if esc, hide for cancel
      else if ( event.keyCode === 27 ) {
        DomUtils.acceptEvent(event);
        this.hide(false);
      }
    });

    // hue-ctrl

    this.$hueCtrl.addEventListener('mousedown', event => {
      DomUtils.acceptEvent(event);
      FocusMgr._setFocusElement(this);
      this.$hueCtrl.focus();

      let alpha = this._value[3];

      this._initValue = this._value;
      this._dragging = true;

      let rect = this.$hueCtrl.getBoundingClientRect();
      let ratio = (event.clientY - rect.top)/this.$hueCtrl.clientHeight;

      this.$hueHandle.style.top = `${ratio*100}%`;
      let h = (1-ratio) * 360;
      let hsv = Chroma(this._value).hsv();

      this._value = Chroma(h,hsv[1],hsv[2],'hsv').rgba();
      this._value[3] = alpha;

      this._updateColorDiff();
      this._updateColor(h);
      this._updateAlpha();
      this._updateSliders();
      this._updateHexInput();

      this._emitChange();

      DomUtils.startDrag('ns-resize', event, event => {
        let ratio = (event.clientY - rect.top)/this.$hueCtrl.clientHeight;
        ratio = MathUtils.clamp( ratio, 0, 1 );

        this.$hueHandle.style.top = `${ratio*100}%`;
        let h = (1-ratio) * 360;
        let hsv = Chroma(this._value).hsv();

        this._value = Chroma(h,hsv[1],hsv[2],'hsv').rgba();
        this._value[3] = alpha;

        this._updateColorDiff();
        this._updateColor(h);
        this._updateAlpha();
        this._updateSliders();
        this._updateHexInput();

        this._emitChange();
      }, () => {
        this._dragging = false;

        let ratio = parseFloat(this.$hueHandle.style.top)/100;
        let h = (1-ratio) * 360;

        this._updateColorDiff();
        this._updateColor(h);
        this._updateAlpha();
        this._updateSliders();
        this._updateHexInput();

        this._emitConfirm();
      });
    });
    this.$hueCtrl.addEventListener('keydown', event => {
      // keydown 'esc'
      if (event.keyCode === 27) {
        if ( this._dragging ) {
          DomUtils.acceptEvent(event);

          this._dragging = false;
          DomUtils.cancelDrag();

          this._value = this._initValue;

          this._updateColorDiff();
          this._updateHue();
          this._updateColor();
          this._updateAlpha();
          this._updateSliders();
          this._updateHexInput();

          this._emitChange();
          this._emitCancel();
        }
      }
    });

    // alpha-ctrl

    this.$alphaCtrl.addEventListener('mousedown', event => {
      DomUtils.acceptEvent(event);
      FocusMgr._setFocusElement(this);
      this.$alphaCtrl.focus();

      this._initValue = this._value.slice();
      this._dragging = true;

      let rect = this.$alphaCtrl.getBoundingClientRect();
      let ratio = (event.clientY - rect.top)/this.$alphaCtrl.clientHeight;

      this.$alphaHandle.style.top = `${ratio*100}%`;
      this._value[3] = parseFloat((1-ratio).toFixed(3));

      this._updateColorDiff();
      this._updateSliders();
      this._emitChange();

      DomUtils.startDrag('ns-resize', event, event => {
        let ratio = (event.clientY - rect.top)/this.$hueCtrl.clientHeight;
        ratio = MathUtils.clamp( ratio, 0, 1 );

        this.$alphaHandle.style.top = `${ratio*100}%`;
        this._value[3] = parseFloat((1-ratio).toFixed(3));

        this._updateColorDiff();
        this._updateSliders();
        this._emitChange();
      }, () => {
        this._dragging = false;

        this._updateSliders();
        this._emitConfirm();
      });
    });
    this.$alphaCtrl.addEventListener('keydown', event => {
      // keydown 'esc'
      if (event.keyCode === 27) {
        if ( this._dragging ) {
          DomUtils.acceptEvent(event);

          this._dragging = false;
          DomUtils.cancelDrag();

          this._value = this._initValue;

          this._updateColorDiff();
          this._updateAlpha();
          this._updateSliders();

          this._emitChange();
          this._emitCancel();
        }
      }
    });

    // color-ctrl

    this.$colorCtrl.addEventListener('mousedown', event => {
      DomUtils.acceptEvent(event);
      FocusMgr._setFocusElement(this);
      this.$colorCtrl.focus();

      let hsv_h = (1-parseFloat(this.$hueHandle.style.top)/100) * 360;
      let alpha = this._value[3];
      this._initValue = this._value.slice();
      this._dragging = true;

      let rect = this.$colorCtrl.getBoundingClientRect();
      let x = (event.clientX - rect.left)/this.$colorCtrl.clientWidth;
      let y = (event.clientY - rect.top)/this.$colorCtrl.clientHeight;
      let c = y * y * ( 3 - 2 * y);
      c = c * 255;

      this.$colorHandle.style.left = `${x*100}%`;
      this.$colorHandle.style.top = `${y*100}%`;
      this.$colorHandle.style.color = Chroma(c, c, c).hex();

      this._value = Chroma(hsv_h,x,1-y,'hsv').rgba();
      this._value[3] = alpha;

      this._updateColorDiff();
      this._updateAlpha();
      this._updateSliders();
      this._updateHexInput();

      this._emitChange();

      DomUtils.startDrag('default', event, event => {
        let x = (event.clientX - rect.left)/this.$colorCtrl.clientWidth;
        let y = (event.clientY - rect.top)/this.$colorCtrl.clientHeight;

        x = MathUtils.clamp( x, 0, 1 );
        y = MathUtils.clamp( y, 0, 1 );
        let c = y * y * ( 3 - 2 * y);
        c = c * 255;

        this.$colorHandle.style.left = `${x*100}%`;
        this.$colorHandle.style.top = `${y*100}%`;
        this.$colorHandle.style.color = Chroma(c, c, c).hex();

        this._value = Chroma(hsv_h,x,1-y,'hsv').rgba();
        this._value[3] = alpha;

        this._updateColorDiff();
        this._updateAlpha();
        this._updateSliders();
        this._updateHexInput();

        this._emitChange();
      }, () => {
        this._dragging = false;

        this._updateColorDiff();
        this._updateAlpha();
        this._updateSliders();
        this._updateHexInput();

        this._emitConfirm();
      });
    });
    this.$colorCtrl.addEventListener('keydown', event => {
      // keydown 'esc'
      if (event.keyCode === 27) {
        if ( this._dragging ) {
          DomUtils.acceptEvent(event);

          this._dragging = false;
          DomUtils.cancelDrag();

          this._value = this._initValue;

          this._updateColorDiff();
          this._updateColor();
          this._updateAlpha();
          this._updateSliders();
          this._updateHexInput();

          this._emitChange();
          this._emitCancel();
        }
      }
    });

    // slider-r
    this.$sliderR.addEventListener('change', event => {
      event.stopPropagation();

      this._value[0] = parseInt(event.detail.value);

      this._updateColorDiff();
      this._updateHue();
      this._updateColor();
      this._updateAlpha();
      this._updateHexInput();

      this._emitChange();
    });
    this.$sliderR.addEventListener('confirm', event => {
      event.stopPropagation();

      this._emitConfirm();
    });
    this.$sliderR.addEventListener('cancel', event => {
      event.stopPropagation();

      this._emitCancel();
    });

    // slider-g
    this.$sliderG.addEventListener('change', event => {
      event.stopPropagation();

      this._value[1] = parseInt(event.detail.value);

      this._updateColorDiff();
      this._updateHue();
      this._updateColor();
      this._updateAlpha();
      this._updateHexInput();

      this._emitChange();
    });
    this.$sliderG.addEventListener('confirm', event => {
      event.stopPropagation();

      this._emitConfirm();
    });
    this.$sliderG.addEventListener('cancel', event => {
      event.stopPropagation();

      this._emitCancel();
    });

    // slider-b
    this.$sliderB.addEventListener('change', event => {
      event.stopPropagation();

      this._value[2] = parseInt(event.detail.value);

      this._updateColorDiff();
      this._updateHue();
      this._updateColor();
      this._updateAlpha();
      this._updateHexInput();

      this._emitChange();
    });
    this.$sliderB.addEventListener('confirm', event => {
      event.stopPropagation();

      this._emitConfirm();
    });
    this.$sliderB.addEventListener('cancel', event => {
      event.stopPropagation();

      this._emitCancel();
    });

    // slider-a
    this.$sliderA.addEventListener('change', event => {
      event.stopPropagation();

      this._value[3] = parseFloat(event.detail.value/255);

      this._updateColorDiff();
      this._updateAlpha();

      this._emitChange();
    });
    this.$sliderA.addEventListener('confirm', event => {
      event.stopPropagation();

      this._emitConfirm();
    });
    this.$sliderA.addEventListener('cancel', event => {
      event.stopPropagation();

      this._emitCancel();
    });

    // hex-input
    this.$hexInput.addEventListener('change', event => {
      event.stopPropagation();
    });
    this.$hexInput.addEventListener('cancel', event => {
      event.stopPropagation();
    });
    this.$hexInput.addEventListener('confirm', event => {
      event.stopPropagation();

      let alpha = this._value[3];
      this._value = Chroma(event.detail.value).rgba();
      this._value[3] = alpha;

      this._updateColorDiff();
      this._updateHue();
      this._updateColor();
      this._updateAlpha();
      this._updateSliders();
      this._updateHexInput();

      this._emitChange();
      this._emitConfirm();
    });

    // add-btn
    this.$btnAdd.addEventListener('confirm', event => {
      event.stopPropagation();
      let clr = Chroma(this._value).css();

      let box = this._newColorBox(clr);
      this.$palette.appendChild(box);

      // save settings
      this._settings.colors.push(clr);
      this._saveSettings();
    });
  },

  _initPalette () {
    let colors = this._settings.colors;
    colors.forEach(clr => {
      let box = this._newColorBox(clr);
      this.$palette.appendChild(box);
    });
  },

  _newColorBox ( color ) {
    let box = document.createElement('div');
    box.classList.add('color-box');

    let inner = document.createElement('div');
    inner.classList.add('inner');
    inner.style.backgroundColor = color;
    box.appendChild(inner);

    box.addEventListener('contextmenu', event => {
      event.preventDefault();

      const menu = new Menu();
      menu.append(new MenuItem({
        label: 'Replace',
        click: () => {
          let idx = DomUtils.index(box);

          let clr = Chroma(this._value).css();
          inner.style.backgroundColor = clr;

          // save settings
          this._settings.colors[idx] = clr;
          this._saveSettings();
        }
      }));
      menu.append(new MenuItem({
        label: 'Delete',
        click: () => {
          let idx = DomUtils.index(box);
          box.remove();

          // save settings
          this._settings.colors.splice(idx,1);
          this._saveSettings();
        }
      }));
      menu.popup(Electron.remote.getCurrentWindow());
    });

    box.addEventListener('mousedown', event => {
      event.stopPropagation();

      // left-mouse down
      if ( event.button === 0 ) {
        this._value = Chroma(inner.style.backgroundColor).rgba();

        // update control
        this._updateColorDiff();
        this._updateHue();
        this._updateColor();
        this._updateAlpha();
        this._updateSliders();
        this._updateHexInput();

        this._emitChange();
        this._emitConfirm();

        return;
      }
    });

    return box;
  },

  _saveSettings () {
    window.localStorage['ui-color-picker'] = JSON.stringify(this._settings);
  },

  _updateColorDiff () {
    this.$oldColor.style.backgroundColor = Chroma(this._lastAssigned).css();
    this.$newColor.style.backgroundColor = Chroma(this._value).css();
  },

  _updateHue () {
    let hsv = Chroma(this._value).hsv();
    if ( isNaN(hsv[0]) ) {
      hsv[0] = 360;
    }

    this.$hueHandle.style.top = `${(1-hsv[0]/360)*100}%`;
  },

  _updateColor (hComp) {
    let cval = Chroma(this._value);
    let hsv = cval.hsv();
    if ( isNaN(hsv[0]) ) {
      hsv[0] = 360;
    }
    let h = hComp === undefined ? hsv[0] : hComp;
    let s = hsv[1];
    let v = hsv[2];
    let c = 1-v;
    c = c * c * ( 3 - 2 * c);
    c = c * 255;

    this.$colorCtrl.style.backgroundColor = Chroma(h,1,1,'hsv').hex();
    this.$colorHandle.style.left = `${s*100}%`;
    this.$colorHandle.style.top = `${(1-v)*100}%`;
    this.$colorHandle.style.color = Chroma(c, c, c).hex();
  },

  _updateAlpha () {
    this.$alphaCtrl.style.backgroundColor = Chroma(this._value).hex();
    this.$alphaHandle.style.top = `${(1-this._value[3])*100}%`;
  },

  _updateSliders () {
    this.$sliderR.value = this._value[0];
    this.$sliderG.value = this._value[1];
    this.$sliderB.value = this._value[2];
    this.$sliderA.value = parseInt(this._value[3]*255);
  },

  _updateHexInput () {
    this.$hexInput.value = Chroma(this._value).hex().toUpperCase();
  },

  _emitConfirm () {
    DomUtils.fire(this, 'confirm', {
      bubbles: false,
      detail: {
        value: this._value,
      },
    });
  },

  _emitCancel () {
    DomUtils.fire(this, 'cancel', {
      bubbles: false,
      detail: {
        value: this._value,
      },
    });
  },

  _emitChange () {
    DomUtils.fire(this, 'change', {
      bubbles: false,
      detail: {
        value: this._value,
      },
    });
  },
});
