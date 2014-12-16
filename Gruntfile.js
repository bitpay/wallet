module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  // Project Configuration
  grunt.initConfig({
    release: {
      options: {
        bump: true,
        file: 'package.json',
        add: true,
        commit: true,
        tag: true,
        push: true,
        pushTags: true,
        npm: false,
        npmtag: true,
        tagName: 'v<%= version %>',
        commitMessage: 'New release v<%= version %>',
        tagMessage: 'Version <%= version %>',
        github: {
          repo: 'bitpay/copay',
          usernameVar: 'GITHUB_USERNAME', //ENVIRONMENT VARIABLE that contains Github username
          passwordVar: 'GITHUB_PASSWORD' //ENVIRONMENT VARIABLE that contains Github password
        }
      }
    },
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
          'js/models/*.js',
          'js/util/*.js',
          'js/plugins/*.js',
          'js/*.js',
          '!js/copayBundle.js',
          '!js/copayMain.js'
        ],
        tasks: ['shell:dev']
      },
      css: {
        files: ['css/src/*.css'],
        tasks: ['cssmin:desktop']
      },
      main: {
        files: [
          'js/init.js',
          'js/app.js',
          'js/directives.js',
          'js/filters.js',
          'js/routes.js',
          'js/services/*.js',
          'js/controllers/*.js'
        ],
        tasks: ['concat:main']
      },
      config: {
        files: ['config.js'],
        tasks: ['shell:dev', 'concat:main']
      },
      test: {
        files: ['test/**/*.js'],
        tasks: ['mochaTest']
      }
    },
    mochaTest: {
      tests: {
        options: {
          require: 'setup/node.js',
          reporter: 'spec',
          mocha: require('mocha')
        },
        src: [
          'test/*.js',
        ]
      }
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
          'lib/lodash/dist/lodash.js',
          'lib/bitcore.js',
          'lib/file-saver/FileSaver.js',
          'lib/socket.io-client/socket.io.js',
          'lib/sjcl.js',
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
          'lib/angular-foundation/mm-foundation-tpls.min.js',
          'lib/angular-gettext/dist/angular-gettext.min.js',
          'lib/angular-load/angular-load.min.js',
          'lib/angular-gravatar/build/md5.min.js',
          'lib/angular-gravatar/build/angular-gravatar.min.js',
          'lib/angular-touch/angular-touch.min.js'
          // If you add libs here, remember to add it too to karma.conf
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
          'js/controllers/*.js',
          'js/translations.js',
          'js/init.js',
        ],
        dest: 'js/copayMain.js'
      }
    },
    cssmin: {
      desktop: {
        files: {
          'css/copay.min.css': ['css/src/*.css'],
        }
      },
      mobile: {
        files: {
          'css/copay.min.css': ['css/src/*.css', '!css/src/desktop.css', '!css/src/animation.css'],
        }
      },
      vendors: {
        files: {
          'css/vendors.min.css': ['css/foundation.min.css', 'css/foundation-icons.css']
        }
      }
    },
    uglify: {
      options: {
        mangle: false
      },
      prod: {
        files: {
          'js/copayMain.js': ['js/copayMain.js'],
          'lib/angularjs-all.js': ['lib/angularjs-all.js'],
          'lib/vendors.js': ['lib/vendors.js']
        }
      }
    },
    nggettext_extract: {
      pot: {
        files: {
          'po/template.pot': ['index.html', 'views/*.html', 'views/**/*.html']
        }
      },
    },
    nggettext_compile: {
      all: {
        options: {
          module: 'copayApp'
        },
        files: {
          'js/translations.js': ['po/*.po']
        }
      },
    },
    copy: {
      dist: {
        files: [
          {
            src: [
              'index.html',
              'init.js',
              'config.js',
              'popup.html',
              'css/vendors.min.css',
              'css/copay.min.css',
              'js/copayBundle.js',
              'js/copayMain.js',
              'lib/vendors.js',
              'lib/angularjs-all.js',
              'font/**',
              'img/**',
              'sound/**',
              'views/**'
            ], 
            dest: 'dist/web/'
          }
        ],
      },
    },
    jsdoc: {
      dist: {
        src: ['js/models/*.js', 'js/plugins/*.js'],
        options: {
          destination: 'doc',
          configure: 'jsdoc.conf.json',
          template: './node_modules/grunt-jsdoc/node_modules/ink-docstrap/template',
          theme: 'flatly'
        }
      }
    }
  });


  grunt.registerTask('default', [
    'shell:dev', 'nggettext_compile', 'concat', 'cssmin:desktop', 'cssmin:vendors'
  ]);
  grunt.registerTask('mobile', [
    'shell:dev', 'nggettext_compile', 'concat', 'cssmin:mobile', 'cssmin:vendors'
  ]);
  grunt.registerTask('dist', [
    'shell:prod', 'nggettext_compile', 'concat', 'cssmin:desktop', 'cssmin:vendors', 'uglify', 'copy:dist'
  ]);
  grunt.registerTask('dist-dbg', [
    'shell:prod', 'nggettext_compile', 'concat', 'cssmin:desktop', 'cssmin:vendors', 'copy:dist'
  ]);
  grunt.registerTask('dist-mobile', [
    'shell:prod', 'nggettext_compile', 'concat', 'cssmin:mobile', 'cssmin:vendors', 'uglify', 'copy:dist'
  ]);
  grunt.registerTask('dist-mobile-dbg', [
    'shell:dev', 'nggettext_compile', 'concat', 'cssmin:mobile', 'cssmin:vendors', 'copy:dist'
  ]);
  grunt.registerTask('prod', [
    'shell:prod', 'nggettext_compile', 'concat', 'cssmin:desktop', 'cssmin:vendors', 'uglify'
  ]);
  grunt.registerTask('translate', ['nggettext_extract']);
  grunt.registerTask('docs', ['jsdoc']);
};
