var gulp = require('gulp'),
    webserver = require('gulp-webserver'),
    install = require('gulp-install'),
    html2js = require('gulp-html2js'),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require('gulp-autoprefixer'),
    gutil = require('gulp-util'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    less = require('gulp-less'),
    gulpFilter = require('gulp-filter'),
    mainBowerFiles = require('main-bower-files'),
    gulpIf = require('gulp-if'),
    del = require('del');

var CacheBuster = require('gulp-cachebust'),
    cachebust = new CacheBuster();

var LessPluginAutoPrefix = require('less-plugin-autoprefix'),
    autoprefix = new LessPluginAutoPrefix({browsers: ["last 10 versions"]});

var config = {
    prod: !!gutil.env.prod
};

gulp.task('buildCss', ['clean'], function () {
    return gulp.src('src/style/main.less')
        .pipe(sourcemaps.init())
        .pipe(less(
            config.prod ? {
                compress: true,
                plugins: [autoprefix]
            }
                :
            {}
        ))
        .on('error', gutil.log)
        .pipe(cachebust.resources())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('build/css/'));
});

gulp.task('copyImg', ['clean'], function () {
    return gulp.src('src/images/**/*.*')
        .pipe(gulp.dest('build/images/'));
});

gulp.task('buildJs', ['clean', 'buildTemplate'], function () {
    return gulp.src('src/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(concat('app.js', {newLine: ';'}))
        .pipe(gulpIf(config.prod, uglify()))
        .pipe(cachebust.resources())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('build/'));
});

gulp.task('libs', ['clean'], function () {

    var filterJs = gulpFilter('**/*.js', {restore: true});
    var filterCss = gulpFilter('**/*.css', {restore: true});
    var filterFont = gulpFilter('**/ionicons.*', {restore: true});

    return gulp.src(mainBowerFiles())
        .pipe(filterJs)
        .pipe(concat('libs.js'))
        .pipe(gulpIf(config.prod, uglify()))
        .pipe(gulp.dest('build/libs/'))
        .pipe(filterJs.restore)
        .pipe(filterCss)
        .pipe(concat('libs.css'))
        .pipe(gulp.dest('build/libs/css/'))
        .pipe(filterJs.restore)
        .pipe(filterFont)
        .pipe(gulp.dest('build/libs/fonts/'));

    /* return gulp.src(['./bower.json'])
     .pipe(install());*/
});

gulp.task('buildTemplate', ['clean'], function () {
    return gulp.src('src/**/*.html')
        .pipe(sourcemaps.init())
        .pipe(html2js('templates-app.js', {
            adapter: 'angular',
            base: 'src/',
            name: 'templates-app'
        }))
        .pipe(gulpIf(config.prod, uglify()))
        .pipe(cachebust.resources())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('build/'));
});

gulp.task('server', ['watch', 'build'], function () {
    gulp.src('.')
        .pipe(webserver({
            livereload: true,
            directoryListing: true,
            open: "http://localhost:8000/build/index.html?corp_id=tds2in1",
            proxies: [
                {
                    source: '/api', target: 'http://super.tds.hrtps.com/api'
                }
            ]
        }));
});

gulp.task('clean', function () {
    return del(['build']);
});

gulp.task('buildIndexHtml', ['clean'], function () {
    return gulp.src('index.html')
        .pipe(cachebust.references())
        .pipe(gulp.dest('build/'));
});

//gulp  cause EPERM:   https://github.com/gulpjs/gulp/issues/738 不要用：src/**/*
gulp.task('watch', function () {
    return gulp.watch(['src/**/*.*', './index.html'], ['build'])
        .on('error', gutil.log);
});

//////////////////////////////////////////////////////////
gulp.task('dev', ['watch', 'server']);

gulp.task('build', ['clean', 'buildTemplate', 'buildJs', 'buildCss', 'copyImg', 'libs', 'buildIndexHtml'], function () {
    return gulp.src('index.html')
        .pipe(cachebust.references())
        .pipe(gulp.dest('build/'));
});