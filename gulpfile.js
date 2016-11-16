var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var cleanCSS = require('gulp-clean-css');

gulp.task('compile-scripts', function() {

    return gulp.src([
            'bower_components/js-cookie/src/js.cookie.js',
            'bower_components/bootstrap/dist/js/bootstrap.min.js',
            'umpack-front.js',
        ])
        .pipe(concat('umpack-front.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist_front/js/'));
});


gulp.task('compile-css', function() {

    return gulp.src([
            'bower_components/bootstrap/dist/css/bootstrap.min.css',
            'bower_components/bootstrap/dist/css/bootstrap-theme.min.css',
            'umpack-style.css'
        ])
        .pipe(cleanCSS())
        .pipe(concat('umpack-style.min.css'))
        .pipe(gulp.dest('dist_front/css/'));

});



gulp.task('build-front', [
    'compile-scripts',
    'compile-css'

], function() {
    
    gulp.src('loginModal-template.html').pipe(gulp.dest('dist_front/js/'));
    gulp.src('signupModal-template.html').pipe(gulp.dest('dist_front/js/'));
    gulp.src('userRoleManagementModal-template.html').pipe(gulp.dest('dist_front/js/'));


});
