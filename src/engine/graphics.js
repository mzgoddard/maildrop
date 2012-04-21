(function(window, load, aqua) {
load.module('engine/graphics.js',
  load.script('engine/object.js'),
function(){
  var setTimeout = window.setTimeout,
      when = window.when,
      mat4 = window.mat4;
  
  var Graphics = aqua.type(aqua.type.Base,
    {
      init: function(canvas) {
        this.canvas = canvas;
        this.drawCalls = aqua.PriorityList.create();
        this.shaders = {};
        
        this.deferred = when.defer();
        
        this.projection = mat4.identity(mat4.create());
        this.modelview = mat4.identity(mat4.create());
        this.matrix = mat4.create();
        
        when(this.initContext(), this.deferred.resolve.bind(this.deferred));
        
        when(this.deferred, (function() {
          this.last = Date.now();
          this.sinceLast = 0;
        }).bind(this));
        
      },
      initContext: function() {
        var deferred = when.defer();
        
        function initTestLoop() {
          this.gl = this.canvas.getContext('experimental-webgl', {
            antialias: true
          });
          if (!this.gl) {
            setTimeout(initTestLoop.bind(this), 0);
          } else {
            deferred.resolve(this);
          }
        }
        initTestLoop.call(this);
        
        return deferred.promise;
      },
      draw: function() {
        if (!this.gl) return;
        
        var now = Date.now();
        this.sinceLast += (now - this.last) / 1000;
        this.last = now;
        
        if (this.sinceLast >= 1 / 20) {
          this.drawCalls.callAll(this, this.gl);
        }
        
        while (this.sinceLast >= 1 / 20) {
          this.sinceLast -= 1 / 20;
        }
      },
      addDrawCall: function(drawCall) {
        this.drawCalls.add(drawCall);
        return this;
      },
      removeDrawCall: function(drawCall) {
        this.drawCalls.remove(drawCall);
        return this;
      },
      addShader: function(options) {
        if (this.shaders[options.name])
          return this.shaders[options.name].promise;
        
        var deferred = when.defer();
        this.shaders[options.name] = options;
        options.promise = deferred.promise;
        
        when.chain(when.all([
          this.deferred.promise, 
          load.text(options.path + '.vs'),
          load.text(options.path + '.fs')
        ], this._buildProgram.bind(this, options)), deferred);
        
        return options.promise;
      },
      _buildProgram: function(options) {
        var gl = this.gl,
            program = options.program = gl.createProgram(),
            shader;
        
        // vertex
        options.vertexShader = shader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(shader, load.get(options.path + '.vs'));
        gl.compileShader(shader);
        gl.attachShader(program, shader);
        
        // fragment
        options.fragmentShader = shader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(shader, load.get(options.path + '.fs'));
        gl.compileShader(shader);
        gl.attachShader(program, shader);
        
        gl.linkProgram(program);
      },
      useShader: function(name) {
        this.gl.useProgram(this.shaders[name].program);
      },
      addTexture: function(path) {
        
      },
      useTexture: function(path, num) {
        num = num || 0;
        
        
      },

      drawSquare: function(options) {
        // console.log(options);
        var useCache = !!options.cache,
            buffer = useCache ? options.cache.buffer : false,
            arrayBuffer = useCache ? options.cache.array : false,
            floatView = useCache ? options.cache.view : false,
            gl = this.gl;
        
        if ( !buffer ) {
          buffer = gl.createBuffer();
          arrayBuffer = new ArrayBuffer(4 * 4 * 6);
          floatView = new Float32Array(arrayBuffer);

          if ( useCache ) {
            options.cache.buffer = buffer;
            options.cache.array = arrayBuffer;
            options.cache.view = floatView;
          }
        }
      
        var angle = options.angle,
            // cos = Math.cos(angle),
            // sin = Math.sin(angle),
            // cosh = Math.cos(angle+Math.PI/2),
            // sinh = Math.sin(angle+Math.PI/2),
            x = options.center[ 0 ],
            y = options.center[ 1 ],
            w = options.size[ 0 ] / 2,
            h = options.size[ 1 ] / 2,
            // w2 = options.size[ 0 ] / 2,
            // h2 = options.size[ 1 ] / 2,
            l = Math.mag(w, h),
            a = Math.atan2(h, w),
            cos = Math.cos(angle+a),
            sin = Math.sin(angle+a),
            cosh = Math.cos(angle-a),
            sinh = Math.sin(angle-a),
            cos3 = Math.cos(angle+Math.PI+a),
            sin3 = Math.sin(angle+Math.PI+a),
            cos4 = Math.cos(angle+Math.PI-a),
            sin4 = Math.sin(angle+Math.PI-a),
            shader = this.shaders.basic;
      
        // gl.disable(gl.BLEND);
      
        this.useShader('basic');
      
        if (!shader.matrixLocation) {
          shader.matrixLocation = gl.getUniformLocation(shader.program, 'modelview_projection');
          shader.texture0Location = gl.getUniformLocation(shader.program, 'texture0');
          shader.colorLocation = gl.getUniformLocation(shader.program, 'color');
        
          shader.positionLocation = gl.getAttribLocation(shader.program, 'a_position');
          shader.texcoord0Location = gl.getAttribLocation(shader.program, 'a_texcoord0');
        
          gl.enableVertexAttribArray(shader.positionLocation);
          gl.enableVertexAttribArray(shader.texcoord0Location);
        }

        floatView[0] = x + cos * l;
        floatView[1] = y + sin * l;
      
        floatView[4] = x + cosh * l;
        floatView[5] = y + sinh * l;
      
        // floatView[8] = floatView[4] + Math.cos(angle - Math.PI / 4 * 3) * radius / 3 * 2 * Math.lerp(0.7, 1, Math.random());
        // floatView[9] = floatView[5] + Math.sin(angle - Math.PI / 4 * 3) * radius / 3 * 2 * Math.lerp(0.7, 1, Math.random());

        floatView[8] = x + cos3 * l;
        floatView[9] = y + sin3 * l;

        floatView[12] = floatView[0];
        floatView[13] = floatView[1];

        floatView[16] = floatView[8];
        floatView[17] = floatView[9];

        floatView[20] = x + cos4 * l;
        floatView[21] = y + sin4 * l;

        console.log(floatView, w, h);

        // floatView[]

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, floatView, gl.DYNAMIC_DRAW);
      
        gl.uniformMatrix4fv(shader.matrixLocation, false, this.projection);
        gl.uniform4f(shader.colorLocation, 255 / 255, 90 / 255, 48 / 255, 255 / 255);
        gl.uniform1i(shader.texture0Location, 0);
      
        gl.vertexAttribPointer(shader.positionLocation, 2, gl.FLOAT, false, 4 * 4, 0);
        gl.vertexAttribPointer(shader.texcoord0Location, 2, gl.FLOAT, false, 4 * 4, 2 * 4);
      
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      },
      destroyCache: function(cache) {
        if ( cache.buffer ) {
          this.gl.deleteBuffer( cache );
        }
      }
    }
  );

  var Renderer = aqua.type(aqua.Component,
    {
      ongameadd: function(gameObject, game) {
        this.drawCall = aqua.PriorityItem.create(this.draw.bind(this));
        game.graphics.addDrawCall(this.drawCall);
      },
      ongamedestroy: function(gameObject, game) {
        game.graphics.removeDrawCall(this.drawCall);
      },
      draw: function(graphics, gl) {}
    }
  );

  aqua.graphics = [];
  aqua.initGraphics = function() {
    var graphics = Graphics.create.apply(null, arguments);
    aqua.graphics.push(graphics);
    
    return graphics;
  };
  aqua.Renderer = Renderer;

});
})(this, this.load, this.aqua);