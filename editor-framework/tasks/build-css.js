'use strict';

const Async = require('async');
const Globby = require('globby');
const Path = require('fire-path');
const Fs = require('fire-fs');
const Chalk = require('chalk');

const Yargs = require('yargs');
const Less = require('less');
const LessPluginCleanCSS = require('less-plugin-clean-css');

Yargs.help('help').options({
  'dev': {
    type: 'boolean',
    global: true,
    desc: 'Build no compress version.'
  },
});

let yargv = Yargs.argv;
let srcDir = './styles';
let destDir = './themes/default';
let absSrcDir = Path.resolve(srcDir);

Fs.emptyDirSync(destDir);

Async.series([
  // build less
  next => {
    let paths = Globby.sync([
      `${srcDir}/**/*.less`,
      `!${srcDir}/*.less`,
      `!${srcDir}/themes/**/*.less`,
    ]);
    Async.eachSeries( paths, ( path, done ) => {
      path = Path.normalize(path);

      let relpath = Path.relative(absSrcDir, path);
      let content = Fs.readFileSync( path, { encoding: 'utf8' } );
      let dest = Path.join(destDir, Path.dirname(relpath), Path.basename(relpath, '.less')) + '.css';

      process.stdout.write(Chalk.blue('compile ') + Chalk.cyan(relpath) + ' ...... ');

      let plugins;
      if ( yargv.dev ) {
        plugins = [];
      } else {
        plugins = [
          new LessPluginCleanCSS({
            advanced: true,
          })
        ];
      }

      Less.render(content, {
        paths: ['./styles'],
        plugins: plugins,
      }, (e, output) => {
        if ( e ) {
          process.stdout.write(Chalk.red('error\n'));
          done(e);
          return;
        }

        Fs.ensureDirSync(Path.dirname(dest));
        Fs.writeFileSync(dest, output.css, 'utf8');

        process.stdout.write(Chalk.green('done\n'));
        done();
      });
    }, next);
  },

  // copy other files
  next => {
    let paths = Globby.sync([
      `${srcDir}/**/*.*`,
      `!${srcDir}/**/*.less`
    ]);
    Async.eachLimit( paths, 5, ( path, done ) => {
      path = Path.normalize(path);

      let relpath = Path.relative(absSrcDir, path);
      let content = Fs.readFileSync( path );
      let dest = Path.join(destDir, relpath);

      process.stdout.write(Chalk.blue('copy ') + Chalk.cyan(relpath) + ' ...... ');

      Fs.ensureDirSync(Path.dirname(dest));
      Fs.writeFileSync(dest, content);

      process.stdout.write(Chalk.green('done\n'));
      done();
    }, next);
  },

], err => {
  if ( err ) {
    console.error(Chalk.red(err));
  }

  console.log(Chalk.green('finish'));
});

