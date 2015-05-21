var gulp = require( 'gulp' ),
	uglify = require( 'gulp-uglifyjs' ),
	rev = require( 'gulp-rev' ),
	usemin = require( 'gulp-usemin' ),
	minifyCss = require( 'gulp-minify-css' ),
	minifyHtml = require( 'gulp-minify-html' ),
	gulpCopy = require( 'gulp-copy' ),
	concat = require( 'gulp-concat' ),
	sass = require( 'gulp-sass' )

require('events').EventEmitter.prototype._maxListeners = 100

// gulp.task( 'uglify', function () {
// 	gulp.src( 'public/app/controllers/*.js' )
// 		.pipe( uglify() )
// 		.pipe( gulp.dest( 'public/app/controllers/dist' ) )
// })

gulp.task( 'minify', function() {
	return gulp.src( './public/index.html' )
		.pipe( usemin({
			js: [ uglify() ],
			html: [ minifyHtml({ empty: true }) ],
			appjs: [ 'concat' ]
		}))
		.pipe( gulp.dest( './build/' ) )
})

gulp.task( 'minifyViews', function() {
	return gulp.src( './public/app/views/*.html' )
		// .pipe( minifyHtml({ empty: true }) )
		.pipe( gulp.dest( './build/app/views/' ) )
})

gulp.task( 'copyFonts', function() {
	gulp.src( 'public/fonts/*' )
		.pipe( gulp.dest('build/fonts') )
})

gulp.task( 'copyVendor', function() {
	gulp.src( 'public/vendor/**/*' )
		.pipe( gulp.dest('build/vendor') )
})

gulp.task( 'copyImages', function() {
	gulp.src( 'public/images/**/*' )
		.pipe( gulp.dest('build/images') )
})

gulp.task( 'sass', function() {
	gulp.src( './public/css/*.scss')
		.pipe( sass().on( 'error', sass.logError ) )
		.pipe( gulp.dest( './build/css') )
})

gulp.task( 'default', [
	'minify',
	'minifyViews',
	'copyFonts',
	'copyVendor',
	'copyImages',
	'sass'
])