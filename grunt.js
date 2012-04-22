var fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    sprintf = require('sprintf').sprintf,
    mkdirp = require('mkdirp');

config.init({
  lint: {
    engine: [ 'src/engine/*.js' ],
    files: [ 'src/game/*.js' ],
  },
  concat: {
    'dist/maildrop.js': [
      'src/load.js',
      'src/compiled.js',
      'src/engine/base.js',
      'src/engine/math.js',
      'src/engine/object.js',
      'src/engine/graphics.js',
      'src/engine/physics.js',
      'src/engine/sound.js',
      'src/engine/init.js',
      'src/game/main.js',
      'src/game/glider.js',
      'src/game/jet.js',
      'src/game/planet.js',
      'src/game/mail.js'
    ],
    'dist/external.js': [
      'src/externals/gl-matrix/gl-matrix-min.js',
      'src/externals/jquery/dist/jquery.js',
      'src/externals/when/when.js' ]
  },
  min: {
    'dist/external.min.js': 'dist/external.js',
    'dist/maildrop.min.js': 'dist/maildrop.js'
  },
  copy: {
    'dist/index.html': 'index.html',
    'dist/data': 'data'
  },
  cleanup: {
    files: 'dist/{external,maildrop}.js'
  }
});

task.registerBasicTask('copy', 'copy files', function(data, name) {
  var done = this.async();

  fs.stat(data, function(err, stat) {
    var dirname;
    if (stat.isDirectory()) {
      dirname = name;
    } else {
      dirname = path.dirname(name);
    }

    exec(sprintf('cp -R %s %s', data, name)).on('exit', done);
  });
});

task.registerBasicTask('cleanup', 'copy files', function(data, name) {
  var done = this.async();

  // fs.stat(data, function(err, stat) {
  //   var dirname;
  //   if (stat.isDirectory()) {
  //     dirname = name;
  //   } else {
  //     dirname = path.dirname(name);
  //   }

  exec(sprintf('rm -rf %s', data)).on('exit', done);
  // });
});

task.registerTask('default', 'concat min copy');

task.registerTask('make', 'concat min copy cleanup');
