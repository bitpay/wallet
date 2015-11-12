module.exports = function(grunt) {

  // To add a new brand configuration:
  // 
  // - Create a brand configuration at /brands/<my-brand>/config.json.
  // - Create the brand themes and skins at /brands/<my-brand>/themes.
  // 
  // Usage: grunt --target=<my-brand>
  // 
  // Examples:
  // 
  // grunt
  // grunt --target=copay
  // grunt --target=mtb
  // 

  var fs = require('fs');
  var shell = require('shelljs');
  var brand = grunt.option('target') || 'copay';

  console.log('INFO: Configuring for brand \'' + brand + '\'');

  // Brand Configuration
  var config = grunt.file.readJSON('./brands/' + brand + '/config.json');

  // Project Configuration
  grunt.initConfig({
    exec: {
      clear: {
        command: 'rm -Rf bower_components node_modules'
      },
      osx64: {
        command: 'webkitbuilds/build-osx.sh osx64'
      },
      osx32: {
        command: 'webkitbuilds/build-osx.sh osx32'
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
    concat: {
      options: {
        sourceMap: false,
        sourceMapStyle: 'link' // embed, link, inline
      },
      angular: {
        src: [
          'bower_components/fastclick/lib/fastclick.js',
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
          'bower_components/angular-bitcore-wallet-client/angular-bitcore-wallet-client.js',
          'bower_components/angular-ui-switch/angular-ui-switch.js'
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
          'src/js/brand.js',
          'src/js/init.js',
          'src/js/trezor-url.js',
          'bower_components/trezor-connect/login.js'
        ],
        dest: 'public/js/copay.js'
      },
      css: {
        src: ['src/css/*.css'],
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
        files: [
          {expand: true, cwd: 'webkitbuilds/',src: ['.desktop', '../public/img/icons/favicon.ico', '../public/img/icons/icon-256.png'],dest: 'webkitbuilds/copay/linux32/', flatten: true, filter: 'isFile' },
          {expand: true, cwd: 'webkitbuilds/',src: ['.desktop', '../public/img/icons/favicon.ico', '../public/img/icons/icon-256.png'],dest: 'webkitbuilds/copay/linux64/', flatten: true, filter: 'isFile' },
        ],
      },
      rename_ios_plist: {
        files: [{
          expand: true,
          cwd: 'cordova/ios',
          src: 'App-Info.plist',
          dest: './',
          rename: function(dest, src) {
            return dest + config.appShortName.replace(/ +/g, '') + '-Info.plist';
          }
        }],
      },
      theme: {
        files: [{
          expand: true,
          cwd: 'brands/' + brand + '/themes/',
          src: ['**'],
          dest: 'public/themes/'
        }]
      },
      android_res: {
        files: [{
          expand: true,
          cwd: 'brands/' + brand + '/resources/android/res/',
          src: ['**'],
          dest: 'cordova/android/res/'
        }]
      },
      ios_icons: {
        files: [{
          expand: true,
          cwd: 'brands/' + brand + '/resources/ios/icons/',
          src: ['**'],
          dest: 'cordova/ios/icons/'
        }]
      },
      ios_splash: {
        files: [{
          expand: true,
          cwd: 'brands/' + brand + '/resources/ios/splash/',
          src: ['**'],
          dest: 'cordova/ios/splash/'
        }]
      },
      wp_assets: {
        files: [{
          expand: true,
          cwd: 'brands/' + brand + '/resources/wp/Assets/',
          src: ['**'],
          dest: 'cordova/wp/Assets/'
        }]
      },
      wp_imgs: {
        files: [{
          expand: true,
          cwd: 'brands/' + brand + '/resources/wp/',
          src: '*.{jpg,png}',
          dest: 'cordova/wp/'
        }]
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
          platforms: ['win','osx','linux'],
          buildDir: './webkitbuilds',
          version: '0.12.2',
          macIcns: './public/img/icons/icon.icns',
          exeIco: './public/img/icons/icon.ico'
      },
      src: ['./package.json', './public/**/*']
    },
    compress: {
      linux32: {
        options: {
          archive: './webkitbuilds/copay-linux32.zip'
        },
        expand: true,
        cwd: './webkitbuilds/copay/linux32/',
        src: ['**/*'],
        dest: 'copay-linux32/'
      },
      linux64: {
        options: {
          archive: './webkitbuilds/copay-linux64.zip'
        },
        expand: true,
        cwd: './webkitbuilds/copay/linux64/',
        src: ['**/*'],
        dest: 'copay-linux64/'
      }
    },
    'string-replace': {
      build_config: {
        files: {
          'cordova/android/AndroidManifest.xml': 'build-config-templates/cordova/android/AndroidManifest.xml',
          'cordova/android/project.properties': 'build-config-templates/cordova/android/project.properties',
          'cordova/build.sh': 'build-config-templates/cordova/build.sh',
          'cordova/config.xml': 'build-config-templates/cordova/config.xml',
          'cordova/Makefile': 'build-config-templates/cordova/Makefile',
          'cordova/ios/App-Info.plist': 'build-config-templates/ios/App-Info.plist',
          'cordova/wp/Package.appxmanifest': 'build-config-templates/cordova/wp/Package.appxmanifest',
          'cordova/wp/Properties/WMAppManifest.xml': 'build-config-templates/cordova/wp/Properties/WMAppManifest.xml',
          'Makefile': 'build-config-templates/Makefile',
          'package.json': 'build-config-templates/package.json',
          'webkitbuilds/.desktop': 'build-config-templates/webkitbuilds/.desktop',
          'webkitbuilds/build-osx.sh': 'build-config-templates/webkitbuilds/build-osx.sh',
          'webkitbuilds/setup-win32.iss': 'build-config-templates/webkitbuilds/setup-win32.iss',
          'webkitbuilds/setup-win64.iss': 'build-config-templates/webkitbuilds/setup-win64.iss'
        },
        options: {
          replacements: [
            { pattern: /%APP-PACKAGE-NAME%/g, replacement: config.appPackageName },
            { pattern: /%APP-SHORT-NAME%/g, replacement: config.appShortName },
            { pattern: /%APP-SHORT-CAMEL-NAME%/g, replacement: config.appShortName.replace(/ +/g, '') },
            { pattern: /%APP-LONG-NAME%/g, replacement: config.appLongName },
            { pattern: /%APP-EXE-NAME%/g, replacement: config.appExeName },
            { pattern: /%APP-DESCRIPTION%/g, replacement: config.appDescription },
            { pattern: /%APP-PUBLISHER%/g, replacement: config.appPublisher },
            { pattern: /%APP-PUBLISHER-WEBSITE%/g, replacement: config.appPublisherWebsite },
            { pattern: /%APP-PUBLISHER-EMAIL%/g, replacement: config.appPublisherEmail },
            { pattern: /%APP-SPLASH-SCREEN%/g, replacement: config.appSplashScreen },
            { pattern: /%APP-VERSION%/g, replacement: config.appVersion },
            { pattern: /%ANDROID-VERSION-CODE%/g, replacement: config.androidVersionCode }
          ]
        }
      }
    }
  });

  getCommitHash = function() {
    //exec git command to get the hash of the current commit
    //git rev-parse HEAD
    var hash = shell.exec('git rev-parse HEAD', {
      silent: true
    }).output.trim().substr(0, 7);
    return hash;
  };

  getAllFoldersFromFolder = function(dir) {
    var results = [];
    var path;
    fs.readdirSync(dir).forEach(function(item) {
      path = dir + '/' + item;
      var stat = fs.statSync(path);
      if (stat && stat.isDirectory()) {
        results.push(item);
      }
    });
    return results;
  };

  buildBrandConfig = function(jsonFile) {
    var content = '';
    var config = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    config.baseTheme = {};
    config.baseTheme.theme = config.theme;
    config.baseTheme.skins = getAllFoldersFromFolder('./brands/' + brand + '/themes/' + config.baseTheme.theme + '/skins/');
    content += 'window.appVersion = ' + JSON.stringify(config.appVersion,null,2) + ';\n';
    content += 'window.appCommitHash = ' + JSON.stringify(getCommitHash(),null,2) + ';\n';
    content += 'window.androidVersionCode = ' + JSON.stringify(config.androidVersionCode,null,2) + ';\n';
    content += 'window.appShortName = ' + JSON.stringify(config.appShortName,null,2) + ';\n';
    content += 'window.appLongName = ' + JSON.stringify(config.appLongName,null,2) + ';\n';
    content += 'window.appDescriptionappDescription = ' + JSON.stringify(config.appDescription,null,2) + ';\n';
    content += 'window.appPublisher = ' + JSON.stringify(config.appPublisher,null,2) + ';\n';
    content += 'window.appPublisherWebsite = ' + JSON.stringify(config.appPublisherWebsite,null,2) + ';\n';
    content += 'window.appPublisherEmail = ' + JSON.stringify(config.appPublisherEmail,null,2) + ';\n';
    content += 'window.appPackageName = ' + JSON.stringify(config.appPackageName,null,2) + ';\n';
    content += 'window.appExeName = ' + JSON.stringify(config.appExeName,null,2) + ';\n';
    content += 'window.appSplashScreen = ' + JSON.stringify(config.appSplashScreen,null,2) + ';\n';
    content += 'window.disclaimer = ' + JSON.stringify(config.disclaimer,null,2) + ';\n';
    content += 'window.baseTheme = ' + JSON.stringify(config.baseTheme,null,2) + ';\n';
    content += 'window.glidera_CLIENT_ID = ' + JSON.stringify(config.glidera_CLIENT_ID,null,2) + ';\n';
    content += 'window.glidera_CLIENT_SECRET = ' + JSON.stringify(config.glidera_CLIENT_SECRET,null,2) + ';\n';
    content += 'window.glideraCordova_CLIENT_ID = ' + JSON.stringify(config.glideraCordova_CLIENT_ID,null,2) + ';\n';
    content += 'window.glideraCordova_CLIENT_SECRET = ' + JSON.stringify(config.glideraCordova_CLIENT_SECRET,null,2) + ';\n';
    fs.writeFileSync("./src/js/brand.js", content);
  };

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-angular-gettext');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-karma-coveralls');
  grunt.loadNpmTasks('grunt-node-webkit-builder');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-string-replace');

  grunt.registerTask('buildBrand', 'Build the brand configuration.', function() {
    buildBrandConfig('./brands/' + brand + '/config.json');
  });

  grunt.registerTask('default', ['nggettext_compile', 'buildBrand', 'concat', 'copy:icons', 'copy:theme', 'string-replace:build_config', 'copy:rename_ios_plist', 'copy:android_res', 'copy:ios_icons', 'copy:ios_splash', 'copy:wp_assets', 'copy:wp_imgs']);
  grunt.registerTask('prod', ['default', 'uglify']);
  grunt.registerTask('translate', ['nggettext_extract']);
  grunt.registerTask('test', ['karma:unit']);
  grunt.registerTask('test-coveralls', ['karma:prod', 'coveralls']);
  grunt.registerTask('desktop', ['prod', 'nodewebkit', 'copy:linux', 'compress:linux32', 'compress:linux64', 'exec:osx32', 'exec:osx64']);

};
