# Creating Single Page Panel

Sometimes we just need a single window that will load an html file to do something, just like a SPA(Single Page Application) in front-end development.

Use simple panel has some advantage such as you can use your front-end skill with no limitation. Also it is good to porting your exists HTML5 application to your app. Since the single page panel is standalone, it can't be docked to main window or other dockable panel window.

This can be done by using `"type": "simple"` in package.json in your panel registry.

Here is an example:

```javascript
{
  "name": "simple-package",
  "panel": {
    "main": "panel/index.html",
    "type": "simple",
    "title": "Simple Panel",
    "width": 400,
    "height": 300
  }
}
```

**NOTE:** The `main` field no longer accept javascript when type is simple. Instead you should give it a HTML file.

The html entry file will looks like this:

```html
<html>
  <head>
    <title>Simple Panel Window</title>
    <meta charset="utf-8">
    <style>
      body {
        margin: 10px;
      }

      h1 {
        color: #f90
      }
    </style>
  </head>

  <body>
    <h1>A simple panel window</h1>
    <button id="btn">Send Message</button>

    <script>
      let btn = document.getElementById('btn');
      btn.addEventListener('click', () => {
        Editor.log('on button clicked!');
      });
    </script>
  </body>
</html>
```

This is a very common HTML page, and you can use any front-end skill to develop it.

Once all your work has done, you can open your panel through `Editor.Panel.open('simple-package')`.
