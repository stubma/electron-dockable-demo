# CSS Layouts

When creating new editor window or package panel, we recommend using [CSS Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) to layout your web page. To make things easy, Editor-Framework wrap the flexbox layout to some css classes and properties.  

## Layout Vertical and Horizontal

**layout horizontal**

```html
<div class="layout horizontal">
  <div>1</div>
  <div class="flex-1">2 (flex-1)</div>
  <div>3</div>
</div>
```

![layout-horizontal](https://cloud.githubusercontent.com/assets/174891/17612414/23415740-6084-11e6-99b1-00eb119b640f.png)

**layout vertical**

```html
<div class="layout vertical">
  <div>1</div>
  <div class="flex-1">2 (flex-1)</div>
  <div>3</div>
</div>
```

![layout-vertical](https://cloud.githubusercontent.com/assets/174891/17612415/240da200-6084-11e6-9272-4e6107987984.png)

## Align Child Elements

When we layout elements in vertical or horizontal, we can align the child elements by putting `start`, `center` or `end` in the parent css class.

For horizontal layout this means align the child at "top", "center" or "bottom" of the parent. for vertical layout it means "left", "center" or "right", let's take horizontal layout as example:

```html
<div class="layout horizontal start">
  <div>1</div>
  <div>2</div>
  <div>3</div>
</div>
<div class="layout horizontal center">
  <div>1</div>
  <div>2</div>
  <div>3</div>
</div>
<div class="layout horizontal end">
  <div>1</div>
  <div>2</div>
  <div>3</div>
</div>
```

![layout-align-items](https://cloud.githubusercontent.com/assets/174891/17612420/349057bc-6084-11e6-8dd6-c33a60034533.png)

Sometimes we need to control single child's alignment, we can do this by `self-` keywords in the css class of child element. For example:

```html
<div class="layout horizontal">
  <div class="self-start">self-start</div>
  <div class="self-center">self-center</div>
  <div class="self-end">self-end</div>
  <div class="self-stretch">self-stretch</div>
</div>
```

![layout-self-align](https://cloud.githubusercontent.com/assets/174891/17612423/3b3ffe64-6084-11e6-8e28-6eedf16905f2.png)

## Justify Child Elements

We've learn how to align children to parent in the above. But how can we specify the place for an element along the parent container? This is done by `justified` keywords. Editor-Framework provide `justified`, `around-justified`, `start-justified`, `center-justified` and `end-justified` for doing it:

```html
<div class="layout horizontal justified">
  <div>1</div>
  <div>2</div>
  <div>3</div>
</div>
<div class="layout horizontal around-justified">
  <div>1</div>
  <div>2</div>
  <div>3</div>
</div>
  ...
  ...
```

![layout-justified](https://cloud.githubusercontent.com/assets/174891/17612424/41955d86-6084-11e6-9627-5d02ecbf78d5.png)

## Flex Ratio

We may like the element to fill the space of parent container, when several child elements have the same wish, it depends on the `flex-` keywords in each child element. The `flex-` class indicates how much space a child would like to have by giving it a number as ratio:

```html
<div class="layout horizontal">
  <div class="flex-1">flex-1</div>
  <div class="flex-2">flex-2</div>
  <div class="flex-3">flex-3</div>
</div>
<div class="layout horizontal">
  <div class="flex-none">flex-none</div>
  <div class="flex-1">flex-1</div>
  <div class="flex-none">flex-none</div>
</div>
  ...
  ...
```

![layout-flex](https://cloud.githubusercontent.com/assets/174891/17612429/4af83fd8-6084-11e6-9635-b239920be2f1.png)

We also can fit the element to the whole parent by `fit` class:

```html
<div class="wrapper">
  <div class="fit">fit</div>
</div>
```

![layout-fit](https://cloud.githubusercontent.com/assets/174891/17612430/4c202e84-6084-11e6-9b77-4c674ca69db1.png)


## CSS Layout Tricks

Here we've gathered CSS layout tricks to help develop web page with Editor-Framework:

- [A Guide to Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [Centering in CSS: A Complete Guide](https://css-tricks.com/centering-css-complete-guide/)
