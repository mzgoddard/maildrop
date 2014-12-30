(function(window, load) {

var aqua = window.aqua,
    glider = window.glider;

var Jet = aqua.type(aqua.Component,
  {
    init: function(position, force) {
      this.position = position;
      this.force = force;
    },
    onadd: function(gameObject) {
      this.world = gameObject;
      
      this.particle = aqua.Particle.create(this.position, 20, 1);
      this.particle.isStatic = true;
      this.particle.isTrigger = true;
      this.particle.on('collision', this.oncollision.bind(this));
      
      this.world.addParticle(this.particle);
      // this.x = this.world.box.left + this.world.box.width / 4 * 3;
    },
    oncollision: function(p, collision) {
      if (p.mail) return;
      p.acceleration[0] += this.force[0];
      p.acceleration[1] += this.force[1];
    },
    fixedUpdate: function() {
      // console.log(this.particle.position);
      this.particle.position = this.position;
    //   if (this.x < this.world.box.left) {
    //     this.x = this.world.box.right;
    //   }
    //   
    //   this.particle.position[0] = this.world.box.left + 320;
    }
  }
);

glider.Jet = Jet;

})(this, this.load);