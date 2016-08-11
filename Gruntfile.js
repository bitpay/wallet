'use strict';

module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  // Project Configuration
  grunt.initConfig({
    exec: {
      appConfig: {
        command: 'node ./util/buildAppConfig.js'
      },
      coinbase: {
        command: 'node ./util/coinbase.js'
      },
      clean: {
        command: 'rm -Rf bower_components node_modules'
      },
      cordovaclean: {
        command: 'make -C cordova clean'
      },
      osx: {
        command: 'webkitbuilds/build-osx.sh sign'
      },
      coveralls: {
        command: 'cat  coverage/report-lcov/lcov.info |./node_modules/coveralls/bin/coveralls.js'
      },
      chrome: {
        command: 'make -C chrome-app '
      },
      wp: {
        command: 'make -C cordova wp',
      },
      ios: {
        command: 'make -C cordova ios',
      },
      xcode: {
        command: 'open cordova/project-ios/platforms/ios/*.xcodeproj',
      },
      android: {
        command: 'make -C cordova android',
      },
      androidrun: {
        command: 'make -C cordova androidrun',
      },
      androidbuild: {
        command: 'cd cordova/project && cordova build android --release',
      },
      androidsign: {
        command: 'rm -f cordova/project/platforms/android/build/outputs/apk/android-release-signed-aligned.apk; jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../copay.keystore -signedjar cordova/project/platforms/android/build/outputs/apk/android-release-signed.apk  cordova/project/platforms/android/build/outputs/apk/android-release-unsigned.apk copay_play && ../android-sdk-macosx/build-tools/21.1.1/zipalign -v 4 cordova/project/platforms/android/build/outputs/apk/android-release-signed.apk cordova/project/platforms/android/build/outputs/apk/android-release-signed-aligned.apk ',
        stdin: true,
      },
      desktopsign: {
        cmd: 'gpg -u 1112CFA1 --output webkitbuilds/Copay-linux.zip.sig --detach-sig webkitbuilds/Copay-linux.zip && gpg -u 1112CFA1 --output webkitbuilds/Copay-win.exe.sig --detach-sig webkitbuilds/Copay-win.exe'
      },
      desktopverify: {
        cmd: 'gpg --verify webkitbuilds/Copay-linux.zip.sig webkitbuilds/Copay-linux.zip && gpg --verify webkitbuilds/Copay-win.exe.sig webkitbuilds/Copay-win.exe'
      },
    },
    watch: {
      options: {
        dateFormat: function(time) {
          grunt.log.writeln('The watch finished in ' + time + 'ms at ' + (new Date()).toString());
          grunt.log.writeln('Waiting for more changes...');
        },
      },
      css: {
        files: ['src/sass/*.css', 'src/css/*.css'],
        tasks: ['concat:css']
      },
      sass: {
        files: ['src/sass/*.scss'],
        tasks: ['sass', 'concat:css']
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
          'src/js/controllers/**/*.js'
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
          'bower_components/angular-ui-router/release/angular-ui-router.js',
          'bower_components/angular-moment/angular-moment.js',
          'bower_components/ng-lodash/build/ng-lodash.js',
          'bower_components/angular-qrcode/angular-qrcode.js',
          'bower_components/angular-gettext/dist/angular-gettext.js',
          'bower_components/angular-sanitize/angular-sanitize.js',
          'bower_components/ng-csv/build/ng-csv.js',
          'bower_components/angular-mocks/angular-mocks.js',
          'angular-pbkdf2/angular-pbkdf2.js',
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
          'src/js/controllers/**/*.js',
          'src/js/translations.js',
          'src/js/appConfig.js',
          'src/js/coinbase.js',
          'src/js/init.js',
          'src/js/trezor-url.js',
          'bower_components/trezor-connect/login.js'
        ],
        dest: 'public/js/copay.js'
      },
      css: {
        src: ['src/sass/*.css', 'src/css/*.css'],
        dest: 'public/css/copay.css'
      },
      foundation: {
        src: [
          'bower_components/angular/angular-csp.css',
          'bower_components/foundation/css/foundation.css',
          'bower_components/animate.css/animate.css'
        ],
        dest: 'public/css/foundation.css',
      },
      ionic_js: {
        src: [
          'bower_components/ionic/release/js/ionic.bundle.min.js'
        ],
        dest: 'public/lib/ionic.bundle.js'
      },
      ionic_css: {
        src: [
          'bower_components/ionic/release/css/ionic.min.css'
        ],
        dest: 'public/css/ionic.css',
      },
      ui_components_js: {
        src: [
          'bower_components/jquery/dist/jquery.js',
          'bower_components/roundSlider/dist/roundslider.min.js',
          'bower_components/angular-gridster/dist/angular-gridster.min.js',
          'bower_components/javascript-detect-element-resize/detect-element-resize.js'
        ],
        dest: 'public/lib/ui-components.js'
      },
      ui_components_css: {
        src: [
          'bower_components/roundSlider/dist/roundslider.min.css',
          'bower_components/angular-gridster/dist/angular-gridster.min.css'
        ],
        dest: 'public/css/ui-components.css',
      },
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
            'public/views/**/*.html',
            'src/js/routes.js',
            'src/js/services/*.js',
            'src/js/controllers/**/*.js'
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
      ionic_fonts: {
        expand: true,
        flatten: true,
        src: 'bower_components/ionic/release/fonts/ionicons.*',
        dest: 'public/fonts/'
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
    nwjs: {
      options: {
        appName: 'Copay',
        platforms: ['win64', 'osx64', 'linux64'],
        buildDir: './webkitbuilds',
        version: '0.16.0',
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
          'angular-bitcore-wallet-client/angular-bitcore-wallet-client.js': ['angular-bitcore-wallet-client/index.js'],
          'angular-pbkdf2/angular-pbkdf2.js': ['angular-pbkdf2/index.js']
        },
      }
    }
  });

  grunt.registerTask('default', ['nggettext_compile', 'exec:appConfig', 'exec:coinbase', 'browserify', 'sass', 'concat', 'copy:icons', 'copy:ionic_fonts']);
  grunt.registerTask('prod', ['default', 'uglify']);
  grunt.registerTask('translate', ['nggettext_extract']);
  grunt.registerTask('test', ['karma:unit']);
  grunt.registerTask('test-coveralls', ['browserify', 'karma:prod', 'exec:coveralls']);
  grunt.registerTask('desktop', ['prod', 'nwjs', 'copy:linux', 'compress:linux']);
  grunt.registerTask('osx', ['prod', 'nwjs', 'exec:osx']);
  grunt.registerTask('chrome', ['exec:chrome']);
  grunt.registerTask('wp', ['prod', 'exec:wp']);
  grunt.registerTask('wp-debug', ['default', 'exec:wp']);
  grunt.registerTask('ios', ['prod', 'exec:ios', 'exec:xcode']);
  grunt.registerTask('ios-debug', ['default', 'exec:ios', 'exec:xcode']);
  grunt.registerTask('cordovaclean', ['exec:cordovaclean']);
  grunt.registerTask('android-debug', ['default', 'exec:android', 'exec:androidrun']);
  grunt.registerTask('android', ['prod', 'exec:android']);
  grunt.registerTask('android-release', ['prod', 'exec:android', 'exec:androidsign']);
  grunt.registerTask('desktopsign', ['exec:desktopsign', 'exec:desktopverify']);

};
