'use strict';

// NOTE: this method still cannot get the correct x points when the curve is nearly parallel with y-axis
// EXAMPLE(FAILED): c1 = {x:50,y:50}; c2 = {x:50,y:200}; c3 = {x:0,y:300}; c4 = {x:500,y:300};
function bezierY ( c1, c2, c3, c4, x ) {
  // adjust as you please
  let xTolerance = 0.0001;

  // we could do something less stupid, but since the x is monotonic
  // increasing given the problem constraints, we'll do a binary search.

  // establish bounds
  let lower = 0;
  let upper = 1;
  let percent = 0.5;

  // get initial x
  let tmpX = Editor.Math.bezier( c1.x, c2.x, c3.x, c4.x, percent );

  // loop until completion
  while ( Math.abs(x - tmpX) > xTolerance ) {
    if (x > tmpX) {
      lower = percent;
    } else {
      upper = percent;
    }

    percent = (upper + lower) / 2;
    tmpX = Editor.Math.bezier( c1.x, c2.x, c3.x, c4.x, percent );
  }

  // we're within tolerance of the desired x value.
  // return the y value.
  return Editor.Math.bezier( c1.y, c2.y, c3.y, c4.y, percent );
}

function _drawGrid ( ctx, w, h ) {
  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#555';

  for ( let x = 0; x < w; x += 50 ) {
    ctx.moveTo( x + 0.5, 0.5 );
    ctx.lineTo( x + 0.5, h + 0.5 );
  }

  for ( let y = 0; y < h; y += 50 ) {
    ctx.moveTo( 0.5, y + 0.5 );
    ctx.lineTo( w + 0.5, y + 0.5 );
  }

  ctx.stroke();
}

function _drawBezier ( ctx, c1, c2, c3, c4 ) {
  ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ff0';

    ctx.moveTo( c1.x, c1.y );
    ctx.bezierCurveTo( c2.x, c2.y, c3.x, c3.y, c4.x, c4.y );
  ctx.stroke();

  ctx.beginPath();
    ctx.strokeStyle = '#f00';

    ctx.moveTo( c1.x, c1.y );
    ctx.lineTo( c2.x, c2.y );
  ctx.stroke();

  ctx.beginPath();
    ctx.strokeStyle = '#f00';

    ctx.moveTo( c3.x, c3.y );
    ctx.lineTo( c4.x, c4.y );
  ctx.stroke();

  // for ( let t = 0; t < 1.01; t += 0.05 ) {
  //   let x = Editor.Math.bezier( c1.x, c2.x, c3.x, c4.x, t );
  //   let y = Editor.Math.bezier( c1.y, c2.y, c3.y, c4.y, t );

  //   ctx.beginPath();
  //   ctx.strokeStyle = '#fff';
  //   ctx.arc( x, y, 2, 0, Math.PI*2, true );
  //   ctx.stroke();
  // }

  for ( let x = c1.x; x <= c4.x; x += 100 ) {
    let y = bezierY( c1, c2, c3, c4, x );

    ctx.beginPath();
    ctx.strokeStyle = '#fff';
    ctx.arc( x, y, 2, 0, Math.PI*2, true );
    ctx.stroke();
  }
}

suite(tap, 'curve', t => {
  Editor.Window.resizeSync( 640, 480 );
  // Editor.Window.center();

  t.test('demo', () => {
    helper.runElement(
      'editor-framework://test/live/curve/curve.html', 'simple', '#container',
      el => {
        let pointEL = el.querySelector('#point');
        let canvas = el.querySelector('canvas');
        canvas.width = el.offsetWidth;
        canvas.height = el.offsetHeight;

        let ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        _drawGrid( ctx, canvas.width, canvas.height );

        let c1 = { x: 50, y: 50 };
        let c2 = { x: 50, y: 200 };
        let c3 = { x: 0, y: 300 };
        let c4 = { x: 500, y: 300 };
        _drawBezier( ctx, c1, c2, c3, c4 );

        // for ( let x = c1.x; x <= c4.x; x += 1 ) {
        //   let y1 = bezierY( c1, c2, c3, c4, x );
        //   let t = Editor.Math.solveCubicBezier( c1.x, c2.x, c3.x, c4.x, x );
        //   let y2 = Editor.Math.bezier( c1.y, c2.y, c3.y, c4.y, t );
        //   Editor.log( `y1 = ${y1}, y2 = ${y2}` );
        // }

        // animate

        let start = null;
        let duration = 5000;

        function step (timestamp) {
          if (!start) {
            start = timestamp;
          }
          let progress = timestamp - start;
          let ratio = progress/duration;
          ratio %= 1;

          let x = Editor.Math.bezier( c1.x, c2.x, c3.x, c4.x, ratio );
          let y = Editor.Math.bezier( c1.y, c2.y, c3.y, c4.y, ratio );

          pointEL.style.left = `${x-3}px`;
          pointEL.style.top = `${y-3}px`;

          window.requestAnimationFrame(step);
        }

        window.requestAnimationFrame(step);
      });
  });
});
