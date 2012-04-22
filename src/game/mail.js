(function() {

var Mail = aqua.type(aqua.Component,
{
  init: function(position, velocity) {
    this.position = position || [ 0, 0, 0 ];
    this.velocity = velocity || [ 0, 100, 0 ];
    this.angle = 0;
    this.inWorld = false;
  },
  ongameadd: function(gameobject, game) {
    this.gameObject = gameobject;

    this.particle = aqua.Particle.create(this.position, 10, 100);
    this.particle.mail = this;
    this.particle.ignoreGravity = true;
    // aqua.game.world.addParticle(this.particle);
    this.launch( this.position, this.velocity );
    this.inWorld = true;
  },
  ongamedestroy: function(gameobject, game) {
    if (this.inWorld) {
      aqua.game.world.removeParticle(this.particle);
    }
  },
  fixedUpdate: function() {
    if ( this.inWorld ) {
      this.x = this.particle.position[ 0 ];
      this.y = this.particle.position[ 1 ];
      this.angle = Math.atan2( this.particle.y - this.particle.ly, this.particle.x - this.particle.lx );
    }
  },
  pickup: function() {
    if (this.inWorld) {
      aqua.game.world.removeParticle(this.particle);
      this.inWorld = false;
    }
  },
  launch: function(position, velocity) {
    if ( !this.inWorld ) {
      var tmp = [0,0,0];
      this.particle.position = vec3.create(position);
      this.particle.lastPosition = vec3.subtract(
        vec3.create(position),
        // tmp,
        vec3.scale(
          vec3.create(velocity),
          aqua.game.world.fixedDelta,
          [ 0, 0, 0 ] ),
        [ 0, 0, 0 ] );
      // console.log.apply( console, this.particle.position )
      // console.log.apply( console, this.particle.lastPosition );
      // console.log( this.particle.position, this.particle.lastPosition );
      aqua.game.world.addParticle(this.particle);
      this.inWorld = true;
    }
  }
});

var MailRenderer = aqua.type(aqua.Renderer,
{
  init: function( options ) {
    this.cache = {};
    this.color = [ 255, 90, 48, 255 ];
    if ( options ) {
      this.color = options.color || this.color;
      if ( typeof this.color == 'string' ) {
        this.color = aqua.color( this.color );
      }
    }
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
    // return;
    if ( this.move.inWorld )
    graphics.drawSquare({
      center: this.move.particle.position,
      size: [ 18, 10 ],
      angle: this.move.angle,
      color: this.color,
      cache: this.cache
    });
  }
});

var MailManager = aqua.type(aqua.Component,
{
  init: function() {
    this.mailpackets = [];
    this.fireTimeout = 0;
  },
  onadd: function(gameobject) {
    this.glider = gameobject.get(glider.GliderMove);
    // this.input = gameobject.get(glider.GliderInput);
    this.glider.on('onGliderCollision', this.onGliderCollision.bind(this));
  },
  onGliderCollision: function(glider, otherParticle, collision) {
    if ( otherParticle.mail && otherParticle.mail.inWorld ) {
      if ( aqua.sound ) {
        aqua.sound.play( 'pickup' );
      }
      this.mailpackets.push( otherParticle.mail );
      otherParticle.mail.pickup();
      otherParticle.mail.call('destroyCache');
    }
  },
  fixedUpdate: function() {
    // 
    this.fireTimeout -= aqua.game.world.fixedDelta;
    if ( this.glider.playing && this.fireTimeout < 0 ) {
      var planet = aqua.game.world.planet;

      // angle to center
      var vectorToPlanet = vec3.direction(
            planet.position,
            this.glider.particle.position,
            vec3.create() ),
          angleToCenter = Math.atan2( vectorToPlanet[ 1 ], vectorToPlanet[ 0 ] ),
          perpenAngle = angleToCenter + Math.PI / 2,
          cos = Math.cos(perpenAngle),
          sin = Math.sin(perpenAngle),
          farPosition =
            vec3.add(
              planet.position,
              // [ 0, 0, 0, ],
              [ cos * planet.radius, sin * planet.radius, 0 ],
              vec3.create() ),
          vectorToFar = vec3.direction(
            farPosition,
            this.glider.particle.position,
            vec3.create() );
          farAngle = Math.acos(
            vec3.dot(
              vectorToFar,
              vectorToPlanet ) /
            ( vec3.length( vectorToFar ) *
              vec3.length( vectorToPlanet ) ) ),
          shipAngleVector = [
            Math.cos( this.glider.angle ),
            Math.sin( this.glider.angle ),
            0 ],
          shipAngleToPlanet = Math.acos(
            vec3.dot(
              vec3.normalize( shipAngleVector ),
              vec3.normalize( vectorToPlanet ) ) );

      // $('#debug').text(JSON.stringify([this.glider.angle, angleToCenter + farAngle, angleToCenter - farAngle]));
      // $('#debug').text(JSON.stringify([ farPosition ]));
      if ( shipAngleToPlanet < farAngle ) {
        // console.log('insight');
        // $('#debug').text('insight');
        if( this.mailpackets.length ) {
          this.fireTimeout = 1;
          // console.log('fire', this.mailpackets.length);

          if ( aqua.sound ) {
            aqua.sound.play( 'launch' );
          }

          var gliderVelocity =
                [ this.glider.vx,
                  this.glider.vy,
                  0 ],
              gliderVector =
                [ Math.cos( this.glider.angle ),
                  Math.sin( this.glider.angle ),
                  0 ];
          this.mailpackets.pop().launch(
            vec3.add(
              this.glider.particle.position,
              [ Math.cos( this.glider.angle ) * ( this.glider.particle.radius + 20 ),
                Math.sin( this.glider.angle ) * ( this.glider.particle.radius + 20 ),
                0],
              [ 0, 0, 0 ]
            ),
            vec3.add(
              [ Math.cos( this.glider.angle ) * ( 500 ),
                Math.sin( this.glider.angle ) * ( 500 ),
                0],
              vec3.scale(
                gliderVector,
                vec3.dot( gliderVelocity, gliderVector ) /
                  vec3.dot( gliderVector, gliderVector ) )
            )
          );
        }
        // console.log( this.mailpackets.length );
      }
    }
  }
});

glider.MailGoal = aqua.type(aqua.Component,
  {
    init: function( particle ) {
      this.particle = particle;
      this.particle.on('collision', this.oncollision.bind(this));

      this.score = 0;
      console.log('init');
    },
    ongameadd: function( gameObject, game ) {
      this.gameObject = gameObject;
      game.world.addParticle( this.particle );
      console.log('ongameadd');
    },
    ongamedestroy: function( gameOjbect, game ) {
      game.world.removeParticle( this.particle );
    },
    oncollision: function( otherParticle, collision ) {
      if ( otherParticle.mail && otherParticle.mail.inWorld ) {
        console.log('mail!');
        otherParticle.mail.pickup();
        aqua.game.destroy( otherParticle.mail.gameObject );
        otherParticle.mail.call('complete');

        if ( aqua.sound ) {
          aqua.sound.play( 'score' );
        }

        this.score += 1;
        $('#score').text( 'SCORE: ' + this.score.toString() );
      }
      collision.solve = true;
    }
  });

glider.MailWave = aqua.type( aqua.Component, {
  init: function( options ) {
    this.packets = [];
    this.renderOptions = options.render || {};
    this.options = options;
  },
  ongameadd: function( gameObject, game ) {
    for ( var i = 0; i < this.options.count; i++ ) {
      this.makePacket();
    }
  },
  makePacket: function() {
    var packet = aqua.GameObject.create(),
        position, force,
        side = Math.floor( Math.random() * 4 ),
        self = this;

    if ( side === 0 ) {
      // top
      position = [
        Math.random() * aqua.game.world.box.width,
        aqua.game.world.box.top,
        0 ];
      force = [
        Math.random() * 20 - 10,
        -20 + -Math.random() * 10,
        0 ];
    } else if ( side === 1 ) {
      // right
      position = [
        aqua.game.world.box.right,
        Math.random() * aqua.game.world.box.height,
        0 ];
      force = [
        -20 + -Math.random() * 10,
        Math.random() * 20 - 10,
        0 ];
    } else if ( side === 2 ) {
      // bottom
      position = [
        Math.random() * aqua.game.world.box.width,
        aqua.game.world.box.bottom,
        0 ];
      force = [
        Math.random() * 20 - 10,
        20 + Math.random() * 10,
        0 ];
    } else if ( side === 3 ) {
      // left
      position = [
        aqua.game.world.box.left,
        Math.random() * aqua.game.world.box.height,
        0 ];
      force = [
        20 + Math.random() * 10,
        Math.random() * 20 - 10,
        0 ];
    }
    packet.add( glider.Mail.create( position, force ) );
    packet.add( glider.MailRender.create( this.renderOptions ) );
    aqua.game.add( packet );

    packet = packet.get( glider.Mail );
    this.packets.push( packet );

    packet.on( 'complete', function() {
      var index = self.packets.indexOf( packet );
      if ( index != -1 ) {
        self.packets.splice( index, 1 );
        if ( self.packets.length === 0 ) {
          self.call( 'complete' );
        }
      }
    });
  }
});

glider.WaveManager = aqua.type(aqua.Component, {
  init: function( options ) {
    this.waveCount = 0;
    this.wave = null;
    this.jets = [];
    this.player = options.player;
    this.planet = options.planet;

    this.options = options;
    this.waveOptions = options.waveOptions || {};
  },
  ongameadd: function() {
    this.startWave();
  },
  startWave: function() {
    this.wave = aqua.GameObject.create();
    this.wave.add( glider.MailWave.create( this.waveOptions ) );
    aqua.game.add( this.wave );

    this.wave = this.wave.get( glider.MailWave );
    this.wave.on( 'complete', this.endWave.bind( this ) );

    this.waveCount ++;
    $('#wave').text('WAVE: ' + this.waveCount);
  },
  endWave: function() {
    aqua.game.destroy( this.wave.gameObject );
    this.wave = null;

    setTimeout( this.startWave.bind( this ), 5000 );
  }
});


glider.Mail = Mail;
glider.MailRender = MailRenderer;
glider.MailManager = MailManager;

})();
