(function() {
  var PlanetRenderer = aqua.type( aqua.Renderer,
  {
    init: function(particle) {
      this.particle = particle;
    },
    onadd: function(gameObject) {
      this.world = gameObject;
    },
    ongameadd: function(gameObject, game) {
      this.drawCall = aqua.PriorityItem.create(this.draw.bind(this));
      game.graphics.addDrawCall(this.drawCall);
    },
    ongamedestroy: function(gameObject, game) {
      game.graphics.removeDrawCall(this.drawCall);
    },
    draw: function(graphics, gl) {
      if (!this.shader) {
        graphics.addShader({
          'name': 'a_color',
          'path': 'shaders/a_color'
        });
        
        this.shader = graphics.shaders.a_color;
      }

      if (!this.shader.program) {
        return;
      }

      var precision = 32;

      if (!this.buffer) {
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, ( 2 + precision ) * ( 3 * 4 + 4 ), gl.DYNAMIC_DRAW);
      }

      var arrayBuffer = new ArrayBuffer( ( 2 + precision ) * ( 3 * 4 + 4 )),
          floatView = new Float32Array(arrayBuffer),
          byteView = new Uint8Array(arrayBuffer),
          // particles = this.world.particles,
          p,
          
          // delta = this.world.fixedDelta,

          shader = this.shader,

          buffer = this.buffer,
          // count = particles.length,

          i,
          j,
          offset = 0, // in bytes
          particleArray,
          x, y, r,
          lx, ly, d,
          red,green,blue,alpha;

      if (!shader.matrixLocation) {
        shader.matrixLocation = gl.getUniformLocation(shader.program, 'modelview_projection');

        shader.positionLocation = gl.getAttribLocation(shader.program, 'a_position');
        shader.colorLocation = gl.getAttribLocation(shader.program, 'a_color');

        gl.enableVertexAttribArray(shader.positionLocation);
        gl.enableVertexAttribArray(shader.colorLocation);
      }

      p = this.particle;
      floatView[ 0 ] = p.position[ 0 ];
      floatView[ 1 ] = p.position[ 1 ];
      byteView[ 12 ] = 255;
      byteView[ 13 ] = 255;
      byteView[ 14 ] = 255;
      byteView[ 15 ] = 255;
      for ( var i = 0; i < precision + 1; i++ ) {
        floatView[ ( i + 1 ) * 4 ] = p.position[ 0 ] + Math.cos( Math.PI * i / precision * 2 ) * p.radius;
        floatView[ ( i + 1 ) * 4 + 1 ] = p.position[ 1 ] + Math.sin( Math.PI * i / precision * 2 ) * p.radius;
        byteView[ ( i + 1 ) * 16 + 12 ] = 255;
        byteView[ ( i + 1 ) * 16 + 13 ] = 255;
        byteView[ ( i + 1 ) * 16 + 14 ] = 255;
        byteView[ ( i + 1 ) * 16 + 15 ] = 255;
      }

      // gl.enable(gl.BLEND);

      graphics.useShader('a_color');

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, arrayBuffer, gl.DYNAMIC_DRAW);

      gl.uniformMatrix4fv(shader.matrixLocation, false, graphics.projection);

      gl.vertexAttribPointer(shader.positionLocation, 2, gl.FLOAT, false, 4 * 4, 0);
      gl.vertexAttribPointer(shader.colorLocation, 4, gl.UNSIGNED_BYTE, true, 4 * 4, 3 * 4);

      // console.log( byteView );

      gl.drawArrays(gl.TRIANGLE_FAN, 0, precision + 2);
    }
  });

  glider.ParticleRenderer = PlanetRenderer;
})();