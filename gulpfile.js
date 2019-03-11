const gulp = require('gulp')
const mkdirp = require('mkdirp')
const clean = require('gulp-clean');
const less =require('gulp-less')
const notify = require('gulp-notify'); 
const plumber = require('gulp-plumber');
const browserSync = require('browser-sync').create(); //browser-sync同步服务器
const reload = browserSync.reload; //将browser-sync的reload方法存起来，方便调用
const postcss = require('gulp-postcss');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('autoprefixer');
const minifyCSS = require('gulp-minify-css');
const rename = require("gulp-rename");
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const zip = require('gulp-zip');
const runSequence = require('gulp-sequence').use(gulp);

const dirs = {
  dist: './dist',
  src: './src',
  css: './src/css',
  less: './src/less',
  js: './src/js',
  img: './src/img'
}
const files = {
  lessFiles: './src/less/*.less',
  cssFiles: './src/css/*.css',
  jsFiles: './src/js/*.js',
  imgFiles: './src/img/*.*'
}
// ------------------开发阶段------------------------------------------------------
gulp.task('start', ['create-directory']) //项目初始化的第一个命令
gulp.task('dev-watch', ['server']) //开始编写项目后开启服务器实时更新

// ------------------生产阶段------------------------------------------------------
gulp.task('prefixer', ['autoprefixer']) //给css文件添加浏览器私有前缀 files.cssFiles ==>> .src/css/
gulp.task('min-css', ['minify-css']) //压缩css文件 files.cssFiles ==>> dist/css/
gulp.task('js-handl', ['js-concat-compress']) //合并计算文件  dirs.js/**/*.js ==>> ./dist/js/concated.js

//-------------------一键生成项目文件-----------------------------------------------

gulp.task('bunld-project',runSequence('clean-dist','compile-less','autoprefixer','minify-css','js-concat-compress','img-handl','zip'))
//自动创建基本目录
gulp.task('create-directory', () => {
  for (let i in dirs) {
    mkdirp(dirs[i], err => {
      err ? console.log(err) : console.log('mkdir-->' + dirs[i])
    })
  }
})
gulp.task('clean-dist',()=>{
  return gulp.src('./dist', {read: false}).pipe(clean());
});
//less编译
gulp.task('compile-less', () => {
  return gulp.src(files.lessFiles)
          .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')})) //使用gulp-notify和gulp-plumber用来阻止因为less语法写错跳出监视程序发生
          .pipe(less())
          .pipe(gulp.dest(dirs.css + '/'))
          .pipe(reload({stream: true}))
})
//添加浏览器私有前缀(生产环境)
gulp.task('autoprefixer', () => {
  return gulp.src(files.cssFiles)
          .pipe(sourcemaps.init()) //添加sourcemap,方便调试
          .pipe(postcss([autoprefixer()]))
          .pipe(sourcemaps.write('.'))
          .pipe(gulp.dest(dirs.css + '/'))
})
//压缩css(生产环境)
gulp.task('minify-css', () => {
  return gulp.src(dirs.css + '/**/*.css')
          .pipe(minifyCSS({/*keepBreaks: true*/}))
          .pipe(rename(path => path.basename += '.min'))//重命名文件输出后的样式为 原文件名.min.css
          .pipe(gulp.dest('./dist/css/'))
})
//js文件合并，压缩(生产环境)
gulp.task('js-concat-compress', (cb) => {
  return gulp.src(dirs.js + '/**/*.js')
          .pipe(rename(path => {
            path.basename += ''
            name = path.basename
          }))
          .pipe(concat('bundle.js')) //合并js文件
          .pipe(uglify()) //压缩js文件
          .pipe(rename(path => {
            path.basename = name + '.' + path.basename + '.min'
          }))
          .pipe(gulp.dest('dist/js/'))
})
// 图片无损压缩
gulp.task('img-handl',()=>{
  return gulp.src(files.imgFiles)
    .pipe(imagemin())  //imagemin()里是可以写参数的，有需要的可以去github的页面看看
    .pipe(gulp.dest('./dist/img/'))
});
//本地服务器，热加载
gulp.task('server', ['compile-less'], () => {
  browserSync.init({
    server: './src'
  })
  gulp.watch(dirs.less + '/**/*.less', ['compile-less']) //监视less文件夹中的所有less文件，有改动就调用compile-less任务编译less
  gulp.watch('./src/*.html').on('change', reload)//监视html文件，有改动就刷新浏览器
  gulp.watch(dirs.js + '/**/*.js').on('change', reload)//监视所有js文件有改动就刷新浏览器
})
//项目打包(生产环境)
gulp.task('zip', () => {
  return gulp.src(['./*.html', '**/dist/**/*.*', '!**/node_modules/**/*.*'])//这里需要注意的是，在写要打包的文件时，避免打包的文件不能写在开头，这里'!**/node_modules/**/*.*'放在了最后
          .pipe(zip('roject.zip')) //打包好的文件名
          .pipe(gulp.dest('./'))
})
