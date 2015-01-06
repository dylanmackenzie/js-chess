/* jshint node: true */

var gulp = require('gulp');
var transpiler = require('gulp-es6-module-transpiler');
var sass = require('gulp-sass');
var connect = require('gulp-connect');
var autoprefixer = require('gulp-autoprefixer');
var mocha = require('gulp-mocha');

var paths = {};

paths.inputs = {
  sass: 'sass/**',
  js: 'js/*.js',
  tests: 'test/*.test.js',
  jsdir: 'js/',
  html: 'html/*.html',
  compiledtests: 'test/compiled/*.test.js'
};

paths.outputs = {
  html: 'dist/',
  css: 'dist/css/',
  js: 'dist/js/',
  compiledtests: 'test/compiled/'
};

gulp.task('server', function () {
  return connect.server({
    livereload: true,
    root: 'dist',
    port: 8080
  });
});

gulp.task('sass', function () {
  return gulp.src(paths.inputs.sass)
    .pipe(sass({
      errLogToConsole: true,
      sourceComments: false
    }))
    .pipe(autoprefixer())
    .pipe(gulp.dest(paths.outputs.css))
    .pipe(connect.reload());
});

gulp.task('js', function () {
  return gulp.src(paths.inputs.js)
    .pipe(transpiler({ formatter: 'bundle', importPaths: [paths.inputs.jsdir] }))
    .pipe(gulp.dest(paths.outputs.js))
    .pipe(connect.reload());
});

gulp.task('compiletest', function () {
  return gulp.src(paths.inputs.tests)
    .pipe(transpiler({ formatter: 'bundle', importPaths: [paths.inputs.jsdir], basePath: 'test/'}))
    .pipe(gulp.dest(paths.outputs.compiledtests));
});

gulp.task('test', ['compiletest'], function () {
  return gulp.src(paths.inputs.compiledtests)
    .pipe(mocha());
});

gulp.task('html', function () {
  return gulp.src(paths.inputs.html)
    .pipe(gulp.dest(paths.outputs.html))
    .pipe(connect.reload());
});

gulp.task('watch', function () {
  gulp.watch(paths.inputs.sass, ['sass']);
  gulp.watch(paths.inputs.js, ['js']);
  gulp.watch(paths.inputs.html, ['html']);
});

gulp.task('default', ['build', 'watch', 'server']);
gulp.task('build', ['sass', 'js', 'html']);
