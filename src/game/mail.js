(function() {

var Mail = aqua.type(aqua.Component,
{
  init: function(position) {
    this.position = position;
    this.angle = 0;
    this.inWorld = false;
  },
  ongameadd: function(gameobject, game) {
    this.particle = aqua.Particle.create(this.position, 10, 100);
    this.particle.mail = this;
    this.particle.ignoreGravity = true;
    aqua.game.world.addParticle(this.particle);
    this.inWorld = true;
  },
  ongamedestroy: function(gameobject, game) {
    if (this.inWorld) {
      aqua.game.world.removeParticle(this.particle);
    }
  },
  fixedUpdate: function() {
    this.x = this.particle.position[ 0 ];
    this.y = this.particle.position[ 1 ];
    this.angle = Math.atan2( this.particle.y - this.particle.ly, this.particle.x - this.particle.lx );
  },
  pickup: function() {
    if (this.inWorld) {
      aqua.game.world.removeParticle(this.particle);
      this.inWorld = false;
    }
  },
  launch: function(position, velocity) {
    
  }
});

var MailRenderer = aqua.type(aqua.Renderer,
{
  init: function() {
    this.cache = {};
  },
  onadd: function(gameobject) {
    this.move = gameobject.get(Mail);
  },
  ongamedestroy: function() {
    aqua.Renderer.prototype.ongamedestroy.apply(this, arguments);
    this.destroyCache();
  },
  destroyCache: function() {
    if ( this.graphics ) {
      this.graphics.destroyCache( this.cache );
    }
  },
  draw: function(graphics, gl) {
    // console.log('draw');
    graphics.drawSquare({
      center: this.move.particle.position,
      size: [ 18, 10 ],
      angle: this.move.angle,
      cache: this.cache
    });
  }
});

var MailManager = aqua.type(aqua.type.Base,
{
  
});

glider.Mail = Mail;
glider.MailRender = MailRenderer;

})();
