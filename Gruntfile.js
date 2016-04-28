module.exports = function(grunt) {

  // Project Configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    'string-replace': {
      dist: {
        files: {
          'cordova/config.xml': ['config-templates/config.xml'],
          'cordova/wp/Package.appxmanifest': ['config-templates/Package.appxmanifest'],
          'cordova/wp/Properties/WMAppManifest.xml': ['config-templates/WMAppManifest.xml'],
          'webkitbuilds/.desktop': ['config-templates/.desktop'],
          'webkitbuilds/setup-win.iss': ['config-templates/setup-win.iss']
        },
        options: {
          replacements: [{
            pattern: /%APP-VERSION%/g,
            replacement: '<%= pkg.version %>'
            }, {
            pattern: /%ANDROID-VERSION-CODE%/g,
            replacement: '<%= pkg.androidVersionCode %>'
          }]
        }
      }
    },
    exec: {
      version: {
        command: 'node ./util/version.js'
      },
      coinbase: {
        command: 'node ./util/coinbase.js'
      },
      clear: {
        command: 'rm -Rf bower_components node_modules'
      },
      osx: {
        command: 'webkitbuilds/build-osx.sh sign'
      }
    },
    watch: {
      options: {
        dateFormat: function(time) {
          grunt.log.writeln('The watch finished in ' + time + 'ms at ' + (new Date()).toString());
          grunt.log.writeln('Waiting for more changes...');
        },
      },
      css: {
        files: ['src/css/*.css'],
        tasks: ['concat:css']
      },
      main: {
        files: [
          'src/js/init.js',
          'src/js/app.js',
          'src/js/directives/*.js',
          'src/js/filters/*.js',
          'src/js/routes.js',
          'src/js/services/*.js',
          'src/js/models/*.js',
          'src/js/controllers/*.js'
        ],
        tasks: ['concat:js']
      }
    },
    sass: {
      dist: {
        options: {
          style: 'compact',
          sourcemap: 'none'
        },
        files: [{
          expand: true,
          src: ['src/sass/*.scss'],
          dest: './',
          ext: '.css'
        }]
      }
    },
    concat: {
      options: {
        sourceMap: false,
        sourceMapStyle: 'link' // embed, link, inline
      },
      angular: {
        src: [
          'bower_components/qrcode-generator/js/qrcode.js',
          'bower_components/qrcode-decoder-js/lib/qrcode-decoder.js',
          'bower_components/moment/min/moment-with-locales.js',
          'bower_components/angular/angular.js',
          'bower_components/angular-ui-router/release/angular-ui-router.js',
          'bower_components/angular-foundation/mm-foundation-tpls.js',
          'bower_components/angular-moment/angular-moment.js',
          'bower_components/ng-lodash/build/ng-lodash.js',
          'bower_components/angular-qrcode/angular-qrcode.js',
          'bower_components/angular-gettext/dist/angular-gettext.js',
          'bower_components/angular-touch/angular-touch.js',
          'bower_components/angular-ui-switch/angular-ui-switch.js',
          'bower_components/angular-sanitize/angular-sanitize.js',
          'bower_components/ng-csv/build/ng-csv.js',
          'angular-bitcore-wallet-client/angular-bitcore-wallet-client.js'
        ],
        dest: 'public/lib/angular.js'
      },
      js: {
        src: [
          'src/js/app.js',
          'src/js/routes.js',
          'src/js/directives/*.js',
          'src/js/filters/*.js',
          'src/js/models/*.js',
          'src/js/services/*.js',
          'src/js/controllers/*.js',
          'src/js/translations.js',
          'src/js/version.js',
          'src/js/coinbase.js',
          'src/js/init.js',
          'src/js/trezor-url.js',
          'bower_components/trezor-connect/login.js'
        ],
        dest: 'public/js/copay.js'
      },
      css: {
        src: ['src/css/*.css', 'src/sass/*.css'],
        dest: 'public/css/copay.css'
      },
      foundation: {
        src: [
          'bower_components/angular/angular-csp.css',
          'bower_components/foundation/css/foundation.css',
          'bower_components/animate.css/animate.css',
          'bower_components/angular-ui-switch/angular-ui-switch.css'
        ],
        dest: 'public/css/foundation.css',
      }
    },
    uglify: {
      options: {
        mangle: false
      },
      prod: {
        files: {
          'public/js/copay.js': ['public/js/copay.js'],
          'public/lib/angular.js': ['public/lib/angular.js']
        }
      }
    },
    nggettext_extract: {
      pot: {
        files: {
          'i18n/po/template.pot': [
            'public/index.html',
            'public/views/*.html',
            'public/views/**/*.html',
            'src/js/routes.js',
            'src/js/services/*.js',
            'src/js/controllers/*.js'
          ]
        }
      },
    },
    nggettext_compile: {
      all: {
        options: {
          module: 'copayApp'
        },
        files: {
          'src/js/translations.js': ['i18n/po/*.po']
        }
      },
    },
    copy: {
      icons: {
        expand: true,
        flatten: true,
        src: 'bower_components/foundation-icon-fonts/foundation-icons.*',
        dest: 'public/icons/'
      },
      linux: {
        files: [{
          expand: true,
          cwd: 'webkitbuilds/',
          src: ['.desktop', '../public/img/icons/favicon.ico', '../public/img/icons/icon-256.png'],
          dest: 'webkitbuilds/Copay/linux64/',
          flatten: true,
          filter: 'isFile'
        }],
      }
    },
    karma: {
      unit: {
        configFile: 'test/karma.conf.js'
      },
      prod: {
        configFile: 'test/karma.conf.js',
        singleRun: true
      }
    },
    coveralls: {
      options: {
        debug: false,
        coverageDir: 'coverage/report-lcov',
        dryRun: true,
        force: true,
        recursive: false
      }
    },
    nodewebkit: {
      options: {
        appName: 'Copay',
        platforms: ['win64', 'osx64', 'linux64'],
        buildDir: './webkitbuilds',
        version: '0.12.2',
        macIcns: './public/img/icons/icon.icns',
        exeIco: './public/img/icons/icon.ico'
      },
      src: ['./package.json', './public/**/*']
    },
    compress: {
      linux: {
        options: {
          archive: './webkitbuilds/Copay-linux.zip'
        },
        expand: true,
        cwd: './webkitbuilds/Copay/linux64/',
        src: ['**/*'],
        dest: 'copay-linux/'
      }
    },
    browserify: {
      dist: {
        files: {
          'angular-bitcore-wallet-client/angular-bitcore-wallet-client.js': ['angular-bitcore-wallet-client/index.js']
        },
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-angular-gettext');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-karma-coveralls');
  grunt.loadNpmTasks('grunt-node-webkit-builder');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-string-replace');
  grunt.loadNpmTasks('grunt-contrib-sass');

  grunt.registerTask('default', ['nggettext_compile', 'exec:version', 'exec:coinbase', 'browserify', 'sass', 'concat', 'copy:icons']);
  grunt.registerTask('prod', ['default', 'uglify']);
  grunt.registerTask('translate', ['nggettext_extract']);
  grunt.registerTask('test', ['karma:unit']);
  grunt.registerTask('test-coveralls', ['karma:prod', 'coveralls']);
  grunt.registerTask('desktop', ['prod', 'nodewebkit', 'copy:linux', 'compress:linux']);
  grunt.registerTask('osx', ['prod', 'nodewebkit', 'exec:osx']);
  grunt.registerTask('release', ['string-replace:dist']);
};
