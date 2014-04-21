module.exports = function (grunt) {
  grunt.initConfig({
    browserify: {
      vendor: {
        src: [],
        dest: 'public/vendor.js',
        options: {
          require: ['jquery'],
          alias: ['./lib/moments.js:momentWrapper']
        }
      },
      client: {
        src: ['client/**/*.js'],
        dest: 'public/app.js',
        options: {
          external: ['jQuery', 'momentWrapper'],
          watch: true,
          keepAlive: true
        }
      },
      watchClient: {
        src: ['client/**/*.js'],
        dest: 'public/app.js',
        options: {
          external: ['jQuery', 'momentWrapper'],
          watch: true
        }
      }
    },

    concat: {
      'public/main.js': ['public/vendor.js', 'public/app.js']
    },

    watch: {
      concat: {
        files: ['client/**/*.js'],
        tasks: ['browserify:watchClient', 'concat']
      },
    }
  });

  grunt.loadTasks('../../tasks');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['browserify', 'concat']);
  grunt.registerTask('browserifyWithWatch', [
    'browserify:vendor',
    'watch:concat'
  ]);
};
