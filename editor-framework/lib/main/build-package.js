'use strict';

const Fs = require('fire-fs');
const Del = require('del');
const Chalk = require('chalk');
const Winston = require('winston');

const minimalDesc = ['h', 'min', 's', 'ms', 'μs', 'ns'];
const verboseDesc = ['hour', 'minute', 'second', 'millisecond', 'microsecond', 'nanosecond'];
const convert = [60*60, 60, 1, 1e6, 1e3, 1];

exports.start = function ( opts, done ) {
  // general
  const Gulp = require('gulp').Gulp;
  let gulp = new Gulp(); // create a gulp instance, must be done before any gulp module
  _logEvents(gulp);

  // modules
  const sequence = require('gulp-sequence').use(gulp);
  const Path = require('fire-path');

  let root = opts.path;
  let useBabel = opts.babel || false;

  // ==============================
  // paths
  // ==============================

  let dest = Path.join(root, 'bin/dev');
  let ignores = [
    '!' + Path.join(root,'bin/**'),
    '!' + Path.join(root,'bower_components/**'),
    '!' + Path.join('node_modules/**'),
    '!' + Path.join('docs/**'),
  ];
  // let allfiles = [Path.join('**/*')].concat(ignores);

  let paths = {
    js: [Path.join(root,'**/*.js'), '!'+Path.join(root,'**/gulpfile.js')].concat(ignores),
    html: [Path.join(root,'**/*.html')].concat(ignores),
    css: [Path.join(root,'**/*.css')].concat(ignores),
    less: [Path.join(root,'**/*.less')].concat(ignores),
    json: [Path.join(root,'**/*.json'), '!'+Path.join(root,'package.json')].concat(ignores),
    image: [Path.join(root,'**/*.{png,jpg}')].concat(ignores),
    pkgJson: Path.join(root,'package.json'),
  };
  // let extnameMappings = {
  //   '.less': '.css',
  // };

  // ==============================
  // tasks
  // ==============================

  // js
  gulp.task('js', function () {
    if ( useBabel ) {
      var babel = require('gulp-babel');

      return gulp.src(paths.js)
      .pipe(babel())
      .pipe(gulp.dest(dest));
    }

    return gulp.src(paths.js)
    .pipe(gulp.dest(dest));
  });

  // html
  gulp.task('html', function () {
    return gulp.src(paths.html)
    .pipe(gulp.dest(dest));
  });

  // css
  gulp.task('css', function () {
    return gulp.src(paths.css)
    .pipe(gulp.dest(dest));
  });

  // less
  gulp.task('less', function () {
    var less = require('gulp-less');

    return gulp.src(paths.less)
    .pipe(less())
    .pipe(gulp.dest(dest));
  });

  // json
  gulp.task('json', function () {
    return gulp.src(paths.json)
    .pipe(gulp.dest(dest));
  });

  // images
  gulp.task('image', function () {
    return gulp.src(paths.image)
    .pipe(gulp.dest(dest));
  });

  // package.json
  gulp.task('package.json', function () {
    var pkgJsonObj = JSON.parse(Fs.readFileSync(paths.pkgJson));
    delete pkgJsonObj.build;
    Fs.writeFileSync(Path.join(dest,'package.json'), JSON.stringify(pkgJsonObj,null,2), 'utf8');
  });

  // clean
  gulp.task('clean', function (cb) {
    Del.sync(dest);
    cb();
  });

  // build
  gulp.task('build', sequence(
    'clean',
    'js',
    'html',
    [ 'css', 'less' ],
    'json',
    'image',
    'package.json'
  ));

  gulp.start('build', function ( err ) {
    done (err);
  });
};

//
function _prettyTime ( source, opts ) {
  var verbose, precise, i, spot, sourceAtStep, valAtStep, decimals, strAtStep, results;

  verbose = false;
  precise = false;
  if (opts) {
    verbose = opts.verbose || false;
    precise = opts.precise || false;
  }

  if (!Array.isArray(source) || source.length !== 2) {
    return '';
  }

  if (typeof source[0] !== 'number' || typeof source[1] !== 'number') {
    return '';
  }

  results = '';

  // foreach unit
  for (i = 0; i < 6; i++) {
    spot = i < 3 ? 0 : 1; // grabbing first or second spot in source array
    sourceAtStep = source[spot];

    if (i !== 3 && i !== 0) {
      sourceAtStep = sourceAtStep % convert[i-1]; // trim off previous portions
    }

    if (i === 2) {
      sourceAtStep += source[1]/1e9; // get partial seconds from other portion of the array
    }

    valAtStep = sourceAtStep / convert[i]; // val at this unit

    if (valAtStep >= 1) {
      if (verbose) {
        valAtStep = Math.floor(valAtStep); // deal in whole units, subsequent laps will get the decimal portion
      }
      if (!precise) {
        // don't fling too many decimals
        decimals = valAtStep >= 10 ? 0 : 2;
        strAtStep = valAtStep.toFixed(decimals);
      } else {
        strAtStep = valAtStep.toString();
      }
      if (strAtStep.indexOf('.') > -1 && strAtStep[strAtStep.length-1] === '0') {
        strAtStep = strAtStep.replace(/\.?0+$/,''); // remove trailing zeros
      }
      if (results) {
        results += ' '; // append space if we have a previous value
      }
      results += strAtStep; // append the value
      // append units
      if (verbose) {
        results += ' '+verboseDesc[i];
        if (strAtStep !== '1') {
          results += 's';
        }
      } else {
        results += ' '+minimalDesc[i];
      }
      if (!verbose) {
        break; // verbose gets as many groups as necessary, the rest get only one
      }
    }
  }

  return results;
}

// Format orchestrator errors
function _formatError(e) {
  if (!e.err) {
    return e.message;
  }

  // PluginError
  if (typeof e.err.showStack === 'boolean') {
    return e.err.toString();
  }

  // Normal error
  if (e.err.stack) {
    return e.err.stack;
  }

  // Unknown (string, number, etc.)
  return new Error(String(e.err)).stack;
}

// Wire up logging events
function _logEvents ( gulpInst ) {

  // Total hack due to poor error management in orchestrator
  gulpInst.on('err', function () {
  });

  gulpInst.on('task_start', function (e) {
    // TODO: batch these
    // so when 5 tasks start at once it only logs one time with all 5
    Winston.normal('Starting', '\'' + Chalk.cyan(e.task) + '\'...');
  });

  gulpInst.on('task_stop', function (e) {
    var time = _prettyTime(e.hrDuration);
    Winston.normal(
      'Finished', '\'' + Chalk.cyan(e.task) + '\'',
      'after', Chalk.magenta(time)
    );
  });

  gulpInst.on('task_err', function (e) {
    var msg = _formatError(e);
    var time = _prettyTime(e.hrDuration);
    Winston.normal(
      '\'' + Chalk.cyan(e.task) + '\'',
      Chalk.red('errored after'),
      Chalk.magenta(time)
    );
    Winston.normal(msg);
  });

  gulpInst.on('task_not_found', function (err) {
    Winston.normal(
      Chalk.red('Task \'' + err.task + '\' is not in your gulpfile')
    );
    Winston.normal('Please check the documentation for proper gulpfile formatting');
    process.exit(1);
  });
}
