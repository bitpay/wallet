module.exports = function(grunt) {

  //Load NPM tasks
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-markdown');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Project Configuration
  grunt.initConfig({
    shell: {
      prod: {
        options: {
          stdout: false,
          stderr: false 
        },
        command: 'node ./util/build.js'
      },
      dev: {
        options: {
          stdout: true,
          stderr: true
        },
        command: 'node ./util/build.js -d'
      }
    },
    watch: {
      options: {
        dateFormat: function(time) {
          grunt.log.writeln('The watch finished in ' + time + 'ms at ' + (new Date()).toString());
          grunt.log.writeln('Waiting for more changes...');
        },
      },
      readme: {
        files: ['README.md'],
        tasks: ['markdown']
      },
      scripts: {
        files: [
          'js/models/**/*.js'
        ],
        tasks: ['shell:dev']
      },
      css: {
        files: ['css/src/*.css'],
        tasks: ['cssmin:copay']
      },
      main: {
        files: [
          'js/app.js', 
          'js/directives.js', 
          'js/filters.js', 
          'js/routes.js', 
          'js/services/*.js', 
          'js/controllers/*.js'
        ],
        tasks: ['concat:main']
      }
    },
    mochaTest: {
      options: {
        reporter: 'spec',
      },
      src: ['test/*.js'],
    },
    markdown: {
      all: {
        files: [{
          expand: true,
          src: 'README.md',
          dest: '.',
          ext: '.html'
        }]
      }
    },
    concat: {
      vendors: {
        src: [
          'lib/moment/min/moment.min.js',
          'lib/qrcode-generator/js/qrcode.js',
          'lib/peer.js',
          'lib/bitcore.js',
          'lib/crypto-js/rollups/sha256.js',
          'lib/crypto-js/rollups/pbkdf2.js',
          'lib/crypto-js/rollups/aes.js',
          'lib/file-saver/FileSaver.js',
          'lib/socket.io-client/socket.io.js',
          'lib/sjcl.js',
          'lib/ios-imagefile-megapixel/megapix-image.js',
          'lib/qrcode-decoder-js/lib/qrcode-decoder.min.js'
        ],
        dest: 'lib/vendors.js'
      },
      angular: {
        src: [
          'lib/angular/angular.min.js',
          'lib/angular-route/angular-route.min.js',
          'lib/angular-moment/angular-moment.js',
          'lib/angular-qrcode/qrcode.js',
          'lib/ng-idle/angular-idle.min.js',
          'lib/angular-foundation/mm-foundation.min.js',
          'lib/angular-foundation/mm-foundation-tpls.min.js'
        ],
        dest: 'lib/angularjs-all.js'
      },
      main: {
        src: [
          'js/app.js', 
          'js/directives.js', 
          'js/filters.js', 
          'js/routes.js', 
          'js/services/*.js', 
          'js/controllers/*.js'
        ],
        dest: 'js/copayMain.js'
      }
    },
    cssmin: {
      copay: {
        files: {
          'css/copay.min.css': ['css/src/*.css'],
        }
      },
      vendors: {
        files: {
          'css/vendors.min.css': ['css/foundation.min.css', 'css/foundation-icons.css', 'lib/angular/angular-csp.css']
        }
      }
    },
    uglify: {
      options: {
        mangle: false
      },
      prod: {
        files: {
          'js/copayMain.js': ['js/copayMain.js']
        }
      }
    }
  });

  grunt.registerTask('default', ['shell:dev', 'concat', 'cssmin']);
  grunt.registerTask('prod', ['shell:prod', 'concat', 'cssmin', 'uglify']);

};
