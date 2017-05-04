const gulp = require('gulp');
const gutil = require("gulp-util");

// const debug = require('gulp-debug');
const nodemon = require('gulp-nodemon');
const eslint = require('gulp-eslint');
const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");

let webpackConfig = () => {
  let ret = require('./webpack.config.js');
  webpackConfig.debug = true;
  return ret;
};

gulp.task('webpack', (cb) => {
  webpack(webpackConfig()).run((err, stats) => {
    if(err) throw new gutil.PluginError("webpack", err);
    gutil.log("[webpack]", stats.toString({colors: true}));
    cb();
  });
});

gulp.task('webpack-dev-server', (cb) => {
  new WebpackDevServer(webpack(webpackConfig()), {
    publicPath: "/",
    stats: {colors: true, minimal: true},
  }).listen(8080, "localhost", function(err) {
    if(err) throw new gutil.PluginError("webpack-dev-server", err);
    gutil.log("[webpack-dev-server]", "http://localhost:8080/webpack-dev-server/index.html");
    cb();
  });
});

gulp.task('lint', () => {
  return gulp.src(['s**/*.js', '**/*.jsx', '!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('telegram-bot', () => {
  nodemon({
    script: 'bot/telegram.js',
    ext: 'js',
    ignore: ['node_modules', 'web', 'server'],
    env: { 'NODE_ENV': 'development' }
  });
});

gulp.task('server', () => {
  nodemon({
    script: 'server/app.js',
    ext: 'js',
    ignore: ['node_modules', 'web', 'bot'],
    env: { 'NODE_ENV': 'development' }
  });
});

gulp.task('pre-commit', []);

gulp.task('default', ['webpack-dev-server']);
