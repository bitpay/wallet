module.exports = function(grunt) {

  //Load NPM tasks
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-markdown');
  grunt.loadNpmTasks('grunt-shell');

  // Project Configuration
  grunt.initConfig({
    shell: {
      browserify: {
        options: {
          stdout: true,
          stderr: true
        },
        command: grunt.option('target') === 'dev' ?
            'node ./util/build.js -d ' : 'node ./util/build.js '
      }
    },
    watch: {
      readme: {
        files: ['README.md'],
        tasks: ['markdown']
      },
      scripts: {
        files: ['*.js', '**/*.js', '*.html', '!**/node_modules/**', '!lib/**js', '!browser/vendor-bundle.js', '!js/copayBundle.js'],
        tasks: ['shell'],
      },
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
    }
  });

  grunt.registerTask('default', ['shell','watch']);

};
