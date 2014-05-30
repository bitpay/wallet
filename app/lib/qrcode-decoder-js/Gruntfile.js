'use strict';

module.exports = function(grunt) {

  //Load NPM tasks
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Project Configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        process: function(src, filepath) {
          if (filepath.substr(filepath.length - 2) === 'js') {
            return '// Source: ' + filepath + '\n' +
              src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
          } else {
            return src;
          }
        }
      },
      main: {
        src: ['src/grid.js', 'src/version.js', 'src/detector.js', 'src/formatinf.js', 'src/errorlevel.js', 'src/bitmat.js', 'src/datablock.js', 'src/bmparser.js', 'src/datamask.js', 'src/rsdecoder.js', 'src/gf256poly.js', 'src/gf256.js', 'src/decoder.js', 'src/qrcode.js', 'src/findpat.js', 'src/alignpat.js', 'src/databr.js'],
        dest: 'lib/qrcode-decoder.js'
      },
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= pkg.version %> */\n',
        mangle: false
      },
      main: {
        src: 'lib/qrcode-decoder.js',
        dest: 'lib/qrcode-decoder.min.js'
      }
    },
    watch: {
      main: {
        files: ['src/*.js'],
        tasks: 'compile',
      },
    },
  });

  //Making grunt default to force in order not to break the project.
  grunt.option('force', true);

  //Default task(s).
  grunt.registerTask('default', ['watch']);

  //Compile task (concat + minify)
  grunt.registerTask('compile', ['concat', 'uglify']);
};

