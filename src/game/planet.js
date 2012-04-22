(function() {
  var PlanetRenderer = aqua.type( aqua.Renderer,
  {
    init: function(options) {
      this.particle = options.particle;
      this.color = options.color || 'FFFFFFFF';
      if ( typeof this.color == 'string' ) {
        this.color = aqua.color( this.color );
      }
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

      var precision = 12;

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
          red = this.color[ 0 ],
          green = this.color[ 1 ],
          blue = this.color[ 2 ],
          alpha = this.color[ 3 ];

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
      byteView[ 12 ] = red;
      byteView[ 13 ] = green;
      byteView[ 14 ] = blue;
      byteView[ 15 ] = alpha;
      for ( var i = 0; i < precision + 1; i++ ) {
        floatView[ ( i + 1 ) * 4 ] = p.position[ 0 ] + Math.cos( Math.PI * i / precision * 2 ) * p.radius;
        floatView[ ( i + 1 ) * 4 + 1 ] = p.position[ 1 ] + Math.sin( Math.PI * i / precision * 2 ) * p.radius;
        byteView[ ( i + 1 ) * 16 + 12 ] = red;
        byteView[ ( i + 1 ) * 16 + 13 ] = green;
        byteView[ ( i + 1 ) * 16 + 14 ] = blue;
        byteView[ ( i + 1 ) * 16 + 15 ] = alpha;
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