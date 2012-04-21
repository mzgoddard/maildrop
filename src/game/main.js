(function(window, load) {

window.glider = {};
window.btb = {};
window.muted = false;
window.credits = false;
var when = window.when;

load.module('game/main.js',
  load.chain(load.script('engine/init.js'),
    function() {
      return when.all([
        load.script( 'game/glider.js' ),
        load.script( 'game/planet.js' )
        // load.script('game/ship.js'),
        // load.script('game/enemy.js'),
        // load.script('game/level.js'),
        // load.script('game/common.js'),
        // soundPromise
      ]);
    }
  ),
function() {
setTimeout(function() {
var $ = window.$,
    when = window.when,
    mat4 = window.mat4,
    aqua = window.aqua,
    glider = window.glider;


aqua.game = aqua.Game.create();
aqua.game.tallyStuff = {};

// paper.setup($('canvas')[0]);
// paper.view.viewSize.width=800;
// paper.view.viewSize.height=600;
// aqua.game.task(paper.view.draw.bind(paper.view), aqua.Game.Priorities.RENDER);

//var path = new paper.Path.RoundRectangle(new paper.Rectangle(10, 10, 50, 50), new paper.Size(10, 10));
//path.strokeColor = 'black';

aqua.game.graphics = aqua.Graphics.create();
aqua.game.graphics = aqua.initGraphics($('canvas')[0]);
aqua.game.graphics.addShader({name: 'basic', path:'shaders/basic'});
aqua.game.task(
  aqua.game.call.bind(aqua.game, 'render'),
  aqua.Game.Priorities.RENDER);
aqua.game.task(
  aqua.game.graphics.draw.bind(aqua.game.graphics),
  aqua.Game.Priorities.RENDER);

aqua.game.timing = {
  delta: 0,
  last: Date.now()
};
aqua.game.task(function() {
  var now = Date.now();
  aqua.game.timing.delta = Math.clamp((now - aqua.game.timing.last) / 1000, 0, 0.3);
  aqua.game.timing.last = now;
}, -10);

aqua.game.world = aqua.World.create(aqua.Box.create(1000, 1000, 0, 0));
aqua.game.add(aqua.game.world);
// aqua.game.world.add(aqua.World.PaperRenderer.create());
aqua.game.world.add(aqua.World.Renderer.create());

var planet = aqua.Particle.create([ 500, 500, 0 ], 50, 1);
planet.isStatic = true;
aqua.game.world.addParticle(planet);

var planetRenderer = aqua.GameObject.create();
planetRenderer.add(glider.ParticleRenderer.create(planet));
aqua.game.add(planetRenderer);

// aqua.game.player = btb.makeShip();
// aqua.game.add(aqua.game.player);

aqua.game.player = glider.makeGlider();
aqua.game.add(aqua.game.player);

// aqua.game.add(btb.makeEnemy({move:{},attack:{},render:{}}));
// aqua.game.levelManager = btb.LevelManager.makeLevelManager();
// aqua.game.add(aqua.game.levelManager);

// for ( var idx = 0; idx < 500; idx++ )
//   aqua.game.world.addParticle(
//     aqua.Particle.create([
//         640 * (idx / 500),
//         Math.random()*480,
//         0],
//       15+Math.random()*3,
//       1));

aqua.game.graphics.addDrawCall(aqua.PriorityItem.create(function(graphics, gl) {
  // graphics setup (once)
  gl.clearColor(0, 22 / 255, 55 / 255, 255 / 255);
  graphics.useShader('basic');
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.DST_ALPHA);
}, -1000, false, true));

aqua.game.graphics.addDrawCall(aqua.PriorityItem.create(function(graphics, gl) {
  var width = window.innerWidth,
      height = window.innerHeight,
      ratio = width / height;

  graphics.canvas.width = width;
  graphics.canvas.height = height;
  
  gl.viewport(0, 0, width, height);

  var displayWidth = aqua.game.world.box.width * ( width / height );

  mat4.ortho(
    -( displayWidth - aqua.game.world.box.width ) / 2,
    -( displayWidth - aqua.game.world.box.width ) / 2 + displayWidth,
    0,
    aqua.game.world.box.height,
    0,
    1000,
    graphics.projection );

  // graphics setup
  gl.clear(gl.COLOR_BUFFER_BIT);
  graphics.useShader('basic');
}, -1000));

function loop() {
  aqua.requestAnimFrame.call(null, loop);

  aqua.game.step();
}
loop();
}, 0);

});
})(this, this.load);

