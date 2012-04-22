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
        load.script( 'game/jet.js' ),
        load.script( 'game/planet.js' ),
        load.script( 'game/mail.js' )
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

aqua.sound = aqua.SoundContext.create();
load.json( 'sounds/sounds.json' ).then( function( sounds ) {
  sounds = JSON.parse( sounds );
  for ( var key in sounds ) {
    console.log( key, sounds[ key ].path );
    aqua.sound.load( {
      name: key,
      path: sounds[ key ].path
    }).then( function() {
      console.log(arguments);
    }, function() {
      console.log('error', arguments);
    });
  }
});

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

aqua.colors = {
  bg: '5D7370FF',
  particle: 'FFF5BCFF',
  planet: 'FFF5BCFF',
  ship: '895F53FF',
  mail: [ 255, 90, 48, 255 ]
};

aqua.game.timing = {
  delta: 0,
  last: Date.now()
};
aqua.game.task(function() {
  var now = Date.now();
  aqua.game.timing.delta = Math.clamp((now - aqua.game.timing.last) / 1000, 0, 0.3);
  aqua.game.timing.last = now;
}, -10);

aqua.game.world = aqua.World.create(aqua.Box.create(1500, 1500, 0, 0));

aqua.game.add(aqua.game.world);
// aqua.game.world.add(aqua.World.PaperRenderer.create());
aqua.game.world.add(aqua.World.Renderer.create({
  color: aqua.colors.particle
}));

var planet = aqua.Particle.create([
  aqua.game.world.box.width / 2,
  aqua.game.world.box.height / 2,
  0 ], 50, 1);
aqua.game.world.gravityPosition = planet.position;
planet.isStatic = true;
planet.isTrigger = true;
planet.isPlanet = true;
aqua.game.world.addParticle(planet);
aqua.game.world.planet = planet;

var planetRenderer = aqua.GameObject.create();
planetRenderer.add(glider.ParticleRenderer.create({
  particle: planet,
  color: aqua.colors.planet
}));
planetRenderer.add(glider.MailGoal.create(planet));
aqua.game.add(planetRenderer);

// aqua.game.player = btb.makeShip();
// aqua.game.add(aqua.game.player);

aqua.game.player = glider.makeGlider();
aqua.game.add(aqua.game.player);

// aqua.game.add(btb.makeEnemy({move:{},attack:{},render:{}}));
// aqua.game.levelManager = btb.LevelManager.makeLevelManager();
// aqua.game.add(aqua.game.levelManager);

for ( var idx = 0; idx < 500; idx++ )
  aqua.game.world.addParticle(
    aqua.Particle.create([
        aqua.game.world.box.width * (idx / 500),
        Math.random()*aqua.game.world.box.width,
        0],
      15+Math.random()*3,
      1));

// var jet = aqua.GameObject.create();
aqua.game.world.add( glider.Jet.create(
  [
    planet.position[0] + Math.cos(Math.PI/6) * planet.radius * 2,
    planet.position[1] + Math.sin(Math.PI/6) * planet.radius * 2,
    0 ],
  [
    Math.cos(Math.PI/6) * 6000,
    Math.sin(Math.PI/6) * 6000,
    0
  ] ) );
aqua.game.world.add( glider.Jet.create(
  [
    planet.position[0] + Math.cos(Math.PI/6*5) * planet.radius * 2,
    planet.position[1] + Math.sin(Math.PI/6*5) * planet.radius * 2,
    0 ],
  [
    Math.cos(Math.PI/6*5) * 6000,
    Math.sin(Math.PI/6*5) * 6000,
    0
  ] ) );
aqua.game.world.add( glider.Jet.create(
  [
    planet.position[0] + Math.cos(Math.PI/6*9) * planet.radius * 2,
    planet.position[1] + Math.sin(Math.PI/6*9) * planet.radius * 2,
    0 ],
  [
    Math.cos(Math.PI/6*9) * 6000,
    Math.sin(Math.PI/6*9) * 6000,
    0
  ] ) );

// for ( var i = 0; i < 20; i++ ) {
// var mail = aqua.GameObject.create();
// mail.add( glider.Mail.create([Math.random()*1500, Math.random()*1500, 0],[0,10,0]));
// mail.add( glider.MailRender.create());
// aqua.game.add(mail);
// }

var mail = aqua.GameObject.create();
mail.add( glider.WaveManager.create({
  planet: planet,
  player: aqua.game.player,
  waveOptions: {
    count: 20
    // render: {
    //   color: 
    // }
  }
}) );
aqua.game.add( mail );

var clearColor = aqua.color( aqua.colors.bg );
aqua.game.graphics.addDrawCall(aqua.PriorityItem.create(function(graphics, gl) {
  // graphics setup (once)
  gl.clearColor(
    clearColor[ 0 ] / 255,
    clearColor[ 1 ] / 255,
    clearColor[ 2 ] / 255,
    clearColor[ 3 ] / 255 );
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

window.onresize = function() {
  $('#hud').css('left', window.innerWidth / 2 - $('#hud').width() / 2);
  $('#hud2')
    .css('top', $('#title').height() - $('#wave-label').height())
    .css('left', window.innerWidth / 2 - $('#hud').width() / 2 + $('#hud').width() + 10);
};
window.onresize();

function loop() {
  aqua.requestAnimFrame.call(null, loop);

  aqua.game.step();
}
loop();
}, 0);

});
})(this, this.load);

