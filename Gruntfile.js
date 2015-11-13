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
  var brandId = grunt.option('target') || 'copay';

  console.log('INFO: Configuring for brand \'' + brandId + '\'');

  // Brand Configuration
  var brandConfig = grunt.file.readJSON('./brands/' + brandId + '/config.json');

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
      },
      rm_temp_files: {
        command: 'rm -f cordova/ios/App-Info.plist'
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
          cwd: 'cordova/ios/',
          src: 'App-Info.plist',
          dest: 'cordova/ios/',
          rename: function(dest, src) {
            return dest + brandConfig.shortName.replace(/ +/g, '') + '-Info.plist';
          }
        }],
      },
      theme: {
        files: [{
          expand: true,
          cwd: 'brands/' + brandId + '/themes/',
          src: ['**'],
          dest: 'public/themes/'
        }]
      },
      android_res: {
        files: [{
          expand: true,
          cwd: 'brands/' + brandId + '/resources/android/',
          src: ['**'],
          dest: 'cordova/android/res/'
        }]
      },
      ios_icons: {
        files: [{
          expand: true,
          cwd: 'brands/' + brandId + '/resources/ios/icons/',
          src: ['**'],
          dest: 'cordova/ios/icons/'
        }]
      },
      ios_splash: {
        files: [{
          expand: true,
          cwd: 'brands/' + brandId + '/resources/ios/splash/',
          src: ['**'],
          dest: 'cordova/ios/splash/'
        }]
      },
      wp_assets: {
        files: [{
          expand: true,
          cwd: 'brands/' + brandId + '/resources/wp/Assets/',
          src: ['**'],
          dest: 'cordova/wp/Assets/'
        }]
      },
      wp_imgs: {
        files: [{
          expand: true,
          cwd: 'brands/' + brandId + '/resources/wp/',
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
    replace: {
      build_config: {
        files: {
          'cordova/android/AndroidManifest.xml': 'build-config-templates/cordova/android/AndroidManifest.xml',
          'cordova/android/project.properties': 'build-config-templates/cordova/android/project.properties',
          'cordova/build.sh': 'build-config-templates/cordova/build.sh',
          'cordova/config.xml': 'build-config-templates/cordova/config.xml',
          'cordova/Makefile': 'build-config-templates/cordova/Makefile',
          'cordova/ios/App-Info.plist': 'build-config-templates/cordova/ios/App-Info.plist',
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
          mode: 0755,
          patterns: [
            { match: /%APP-PACKAGE-NAME%/g, replacement: brandConfig.packageName },
            { match: /%APP-SHORT-NAME%/g, replacement: brandConfig.shortName },
            { match: /%APP-SHORT-CAMEL-NAME%/g, replacement: brandConfig.shortName.replace(/ +/g, '') },
            { match: /%APP-LONG-NAME%/g, replacement: brandConfig.longName },
            { match: /%APP-EXE-NAME%/g, replacement: brandConfig.exeName },
            { match: /%APP-DESCRIPTION%/g, replacement: brandConfig.description },
            { match: /%APP-PUBLISHER%/g, replacement: brandConfig.publisher },
            { match: /%APP-PUBLISHER-WEBSITE%/g, replacement: brandConfig.publisherWebsite },
            { match: /%APP-PUBLISHER-EMAIL%/g, replacement: brandConfig.publisherEmail },
            { match: /%APP-SPLASH-SCREEN%/g, replacement: brandConfig.splashScreen },
            { match: /%APP-VERSION%/g, replacement: brandConfig.version },
            { match: /%ANDROID-VERSION-CODE%/g, replacement: brandConfig.androidVersionCode }
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

  cleanJSONQuotesOnKeys = function(json) {
    return json.replace(/"(\w+)"\s*:/g, '$1:');
  }

  buildBrandConfig = function() {
    brandConfig.commitHash = getCommitHash();

    // Build the default theme definition using the directory structure to find available skins.
    brandConfig.features.theme.definition = {};
    brandConfig.features.theme.definition.theme = brandConfig.features.theme.name;
    brandConfig.features.theme.definition.skins = getAllFoldersFromFolder('./brands/' + brandId + '/themes/' + brandConfig.features.theme.definition.theme + '/skins/');
    delete brandConfig.features.theme.name;

    var content = '';
    content += '\'use strict\';\n\n';
    content += '// Do not edit, this file is auto-generated by grunt.\n\n';
    content += 'angular.module(\'copayApp\').constant(\'brand\', \n';
    content += cleanJSONQuotesOnKeys(JSON.stringify(brandConfig, null, 2));
    content += ');\n';

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
  grunt.loadNpmTasks('grunt-replace');

  grunt.registerTask('buildBrand', 'Build the brand configuration.', function() {
    buildBrandConfig();
  });

  grunt.registerTask('default', [
    'nggettext_compile',
    'buildBrand',
    'concat',
    'copy:icons',
    'copy:theme',
    'replace:build_config',
    'copy:rename_ios_plist',
    'copy:android_res',
    'copy:ios_icons',
    'copy:ios_splash',
    'copy:wp_assets',
    'copy:wp_imgs',
    'exec:rm_temp_files'
  ]);

  grunt.registerTask('prod', ['default', 'uglify']);
  grunt.registerTask('translate', ['nggettext_extract']);
  grunt.registerTask('test', ['karma:unit']);
  grunt.registerTask('test-coveralls', ['karma:prod', 'coveralls']);
  grunt.registerTask('desktop', ['prod', 'nodewebkit', 'copy:linux', 'compress:linux32', 'compress:linux64', 'exec:osx32', 'exec:osx64']);

};
