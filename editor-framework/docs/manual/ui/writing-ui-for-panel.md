# Writing UI for Panel

If you are familiar with HTML5 programming, you will feel writing ui for panel is a very easy task. Meanwhile it is very easy to integrate a framework to it, such as [Vue](http://vuejs.org/), [React](https://facebook.github.io/react/) or [Polymer](http://polymer-project.org/).

For those who didn't know too much of HTML5 programming, this section will guide you where to get started.

## Define your template

When we start programming UI for a panel, usually we expect something to show on the screen for prototyping. This can be done by adding `template` and `style` in our panel frame.  

Suppose we try to add some blocks to show our layout:

```javascript
Editor.Panel.extend({
  style: `
    .wrapper {
      box-sizing: border-box;
      border: 2px solid white;
      font-size: 20px;
      font-weight: bold;
    }

    .top {
      height: 20%;
      border-color: red;
    }

    .middle {
      height: 60%;
      border-color: green;
    }

    .bottom {
      height: 20%;
      border-color: blue;
    }
  `,

  template: `
    <div class="wrapper top">Top</div>
    <div class="wrapper middle">Middle</div>
    <div class="wrapper bottom">Bottom</div>
  `,
});
```

You will see a panel like this:

![simple-panel-01](https://cloud.githubusercontent.com/assets/174891/17611417/9f411cc8-6079-11e6-98eb-5c65ffddc094.png)

## Flexbox Layout

In the previous example, we are using the CSS to layout the UI in the panel. You can learn more CSS layout skill from [W3 Schools' CSS Tutorial](http://www.w3schools.com/css/default.asp).

Sometimes we would like to control the height more precise, for instance we would like the top and bottom block be 30 pixel height, and the middle block fill up the rest space. It is recommend to use [CSS Flexbox Layout](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) to achieve this.

Let's change our style to:

```javascript
Editor.Panel.extend({
  /// ...
  style: `
    :host {
      display: flex;
      flex-direction: column;
    }

    .wrapper {
      box-sizing: border-box;
      border: 2px solid white;
      font-size: 20px;
      font-weight: bold;
    }

    .top {
      height: 30px;
      border-color: red;
    }

    .middle {
      flex: 1;
      border-color: green;
    }

    .bottom {
      height: 30px;
      border-color: blue;
    }
  `
});
```

![simple-panel-02](https://cloud.githubusercontent.com/assets/174891/17611690/234c3dca-607c-11e6-8ec2-8cb882348d4d.png)

## Adding UI Element

When we finish the layout prototype, it is time to add some UI element in it. The HTML5 standards provide a bunch of these elements such as `<button>`, `<input>` and so on. These elements are OK to put in but we are highly recommend you to use our the builtin ui-kit for adding common ui. The element defined in ui-kit are come with `<ui-` as prefix, for example: `<ui-button>`, `<ui-input>`. To learn more about how to use it, read the document --- [Using UI Kit](manual/ui/using-ui-kit.md).

Here let's just fill some elements:

```javascript
Editor.Panel.extend({
  style: `
    :host {
      display: flex;
      flex-direction: column;
      margin: 5px;
    }

    .top {
      height: 30px;
    }

    .middle {
      flex: 1;
      overflow: auto;
    }

    .bottom {
      height: 30px;
    }
  `,

  template: `
    <div class="top">
      Mark Down Preview
    </div>

    <div class="middle layout vertical">
      <ui-text-area resize-v placeholder="Editing Markdown..."></ui-text-area>
      <ui-markdown class="flex-1">
        ## Hello World

         - Foo
         - Bar
      </ui-markdown>
    </div>

    <div class="bottom layout horizontal end-justified">
      <ui-button class="green">Preview</ui-button>
    </div>
  `,
});
```

![simple-panel-03](https://cloud.githubusercontent.com/assets/174891/17611937/5c2d6306-607e-11e6-81fb-a1a72d747ec5.png)

## Adding Action

At last, let's add some action to the UI elements. Suppose every time we click "Preview" button, we would like to read the markdown text from text-area and render it in the middle block. we can do this by adding the following code:

```javascript
Editor.Panel.extend({
  /// here we skip style and template...

  $: {
    txt: 'ui-text-area',
    mkd: 'ui-markdown',
    btn: 'ui-button',
  },

  ready () {
    this.$btn.addEventListener('confirm', () => {
      this.$mkd.value = this.$txt.value;
    });

    // init
    this.$mkd.value = this.$txt.value;
  },
});
```

We use the `$` selector to cache the UI element so that we can reuse it in `ready()` callback for listening event in it. Unlike HTML5 standards element, most of ui-kit elements have three common events: `confirm`, `cancel` and `change`.

![simple-panel-04](https://cloud.githubusercontent.com/assets/174891/17612178/8d8bf70c-6081-11e6-8a11-bae61c20de81.png)

I hope this section will inspire you in programming UI with HTML5 technology.
