config.init({
  lint: {
    engine: [ 'src/engine/*.js' ],
    files: [ 'src/game/*.js' ]
  },
  concat: {
    'dist/aqua.js': [ '<config:lint.engine>', '<config:lint.files>' ]
  },
  min: {
    'dist/aqua.min.js': ['dist/aqua.js']
  }
});

task.registerTask('default', 'lint qunit concat min');
