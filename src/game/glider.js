(function(window, load) {
load.module('game/glider.js', null, function() {

// make jshint happy
var document = window.document,
    localStorage = window.localStorage,
    setTimeout = window.setTimeout,
    setInterval = window.setInterval,
    clearInterval = window.clearInterval,
    ArrayBuffer = window.ArrayBuffer,
    Float32Array = window.Float32Array,
    atob = window.atob,

    // Playtomic = window.// Playtomic,
    vec3 = window.vec3,
    when = window.when,
    $ = window.$,

    aqua = window.aqua,
    glider = window.glider;

function normalizeAngle(angle) {
  while (angle > Math.PI)
    angle -= Math.PI * 2;
  while (angle < Math.PI)
    angle += Math.PI * 2;

  return angle;
}

var GliderInput = aqua.type(aqua.Component,
  {
    init: function(inputMap) {
      var key;
      
      this.inputMap = inputMap;
      this.state = {};
      
      for ( key in inputMap ) {
        this.state[inputMap[key]] = {
          pressed: false
        };
      }
    },
    onadd: function() {
      window.addEventListener('keydown', this._keydown = this.keydown.bind(this));
      window.addEventListener('keyup', this._keyup = this.keyup.bind(this));
    },
    ondestroy: function() {
      window.removeEventListener('keydown', this._keydown);
      window.removeEventListener('keyup', this._keyup);
    },
    get: function(name) {
      return this.state[name].pressed;
    },
    getPressTime: function(name) {
      return this.state[name].pressed && Date.now() - this.state[name].start;
    },
    keydown: function(e) {
      var state = this.state[this.inputMap[e.keyCode]];
      if (!state) return;
      
      state.pressed = true;
      if (!state.start)
        state.start = Date.now();
    },
    keyup: function(e) {
      var state = this.state[this.inputMap[e.keyCode]];
      if (!state) return;
      
      state.pressed = false;
      delete state.start;
    }
  }
);

var GliderReset = aqua.type(aqua.Component, {
  init: function(map) {
    this.inputMap = map.inputMap || map;
  },
  ongameadd: function(gameObject, game) {
    this._keydown = this.keydown.bind(this);
    window.addEventListener('keydown', this._keydown);
    this.game = game;
  },
  keydown: function(e) {
    if (this.inputMap[e.keyCode] == 'up') {
      window.removeEventListener('keydown', this._keydown);
      this.game.add(glider.makeGlider());
      this.game.destroy(this.gameObject);
    }
  }
});

var GliderMove = aqua.type(aqua.Component,
  {
    init: function() {
      this.x = 500;
      this.y = 500;

      this.vx = 0;
      this.vy = 0;

      this.ax = 0;
      this.ay = 0;

      this.angle = 0;

      this.radius = 25;
      
      this.score = 0;
      
      this.particle = aqua.Particle.create([this.x, this.y, 0], this.radius, 1);
      this.particle.isTrigger = true;
      this.particle.on('collision', this.oncollision.bind(this));
      
      this.playing = false;
    },
    onadd: function(gameObject) {
      this.input = gameObject.get(GliderInput);
    },
    ondestroy: function() {
      this.input = null;
    },
    ongameadd: function(gameObject, game) {
      game.world.addParticle(this.particle);
      
      this.world = game.world;
      this.sound = game.sound;
      
      // this.x += game.world.box.left;
    },
    ongamedestroy: function(gameObject, game) {
      game.world.removeParticle(this.particle);
      
      if (game.score) {
        game.score.setMove(null);
      }
      
      if (aqua.game.sound) {
        aqua.game.sound.nodes.happy.source.gain.value = 1;
        aqua.game.sound.nodes.zone.source.gain.value = 0;
        aqua.game.sound.nodes.approach.source.gain.value = 0;
      }
    },
    oncollision: function(otherParticle, collision) {
      if (!this.playing) return;
      
      if ( otherParticle.isPlanet ) {
        this.particle.isTrigger = false;
        var fixedDelta = aqua.game.timing.fixedDelta,
            self = this;
        aqua.game.task(function() {
          self.particle.mass = 1e3;
          self.particle.friction = 1;
          // self.particle.lastPosition[ 0 ] = self.particle.position[ 0 ] - self.vx * fixedDelta;
          // self.particle.lastPosition[ 1 ] = self.particle.position[ 1 ] - self.vy * fixedDelta;
        }, aqua.Game.Priorities.GARBAGE, false, true);
        // this.particle.lastPosition[ 0 ] = this.particle.position[ 0 ] - this.vx * fixedDelta;
        // this.particle.lastPosition[ 1 ] = this.particle.position[ 1 ] - this.vy * fixedDelta;
        // console.log( this.particle.position, this.particle.lastPosition );
        return;
      }

      var delta = aqua.game.timing.fixedDelta,
          vx = otherParticle.lastPosition[0] - otherParticle.position[0],
          vy = otherParticle.lastPosition[1] - otherParticle.position[1],
          vl = Math.sqrt(vx*vx+vy*vy),
          va = Math.atan2(vy, vx);
      
      if (isNaN(vx) || isNaN(vy)) {
        return;
      }

      while (va > Math.PI)
        va -= Math.PI * 2;
      while (va < -Math.PI)
        va += Math.PI * 2;

      var k = vl * 10,
          n = k * 
            Math.cos(va + Math.PI - this.angle - Math.PI / 2) * 
            (Math.abs(va - this.angle) < Math.PI / 2 ? 1 : 0),
          nx = Math.cos(this.angle+Math.PI/2) * n,
          ny = Math.sin(this.angle+Math.PI/2) * n;
          // console.log(nx, ny);
      this.ax += Math.clamp(nx, -10, 1000);
      this.ay += ny;
    },
    fixedUpdate: function() {
      if (!this.playing && this.input.get('up')) {
        this.playing = true;

        // Playtomic.Log.Play();
        if (this.gameObject.game.score) {
          this.gameObject.game.score.setMove(this);
        }
        
        this.heatmapTime = Date.now();
      } else if (!this.playing) {
        this.x = this.world.box.left + this.world.box.width / 8 * 4;
        this.y = this.world.box.bottom + this.world.box.height / 8 * 6;
        return;
      }

      if ( !this.particle.isTrigger ) {
        this.x = this.particle.position[ 0 ];
        this.y = this.particle.position[ 1 ];
        return;
      }

      var delta = aqua.game.timing.fixedDelta,
          vl = Math.sqrt(this.vx*this.vx+this.vy*this.vy),
          va = Math.atan2(this.vy, this.vx);

      while (va > Math.PI)
        va -= Math.PI * 2;
      while (va < -Math.PI)
        va += Math.PI * 2;

      // gravity
      var gravity = this.gameObject.game.world.calcGravity( [ this.x, this.y, 0 ], 10 );
      // console.log( gravity );
      this.ax += gravity[ 0 ];
      this.ay += gravity[ 1 ];

      var k = vl * 10,
          n = k * Math.cos(va + Math.PI - this.angle - Math.PI / 2) * (Math.abs(va - this.angle) < Math.PI / 2 ? 1 : 0),
          nx = Math.cos(this.angle+Math.PI/2) * n,
          ny = Math.sin(this.angle+Math.PI/2) * n;

      this.ax += nx;
      this.ay += ny;
      
      if (this.input.get('up')) {
        this.angle += Math.PI * delta;
        
        if (this.x < this.world.box.left + this.world.box.width / 3) {
          this.ax += Math.cos(this.angle) * 50;
          this.ay += Math.sin(this.angle) * 50;
        }
        if (this.y < this.world.box.bottom + this.world.box.height / 8) {
          this.ax += Math.cos(this.angle) * 50;
          this.ay += Math.sin(this.angle) * 200;
        }
      }

      // integrate
      this.vx += this.ax / 2 * delta;
      this.x += this.vx * delta;
      this.vx += this.ax / 2 * delta;

      this.vy += this.ay / 2 * delta;
      this.y += this.vy * delta;
      this.vy += this.ay / 2 * delta;
      
      vec3.set([this.x, this.y, 0], this.particle.position);

      this.angle -= Math.PI * 0.2 * delta;
      
      if (this.angle > Math.PI) {
        this.canScoreBackflip = true;
      }
      
      while (this.angle > Math.PI)
        this.angle -= Math.PI * 2;
      while (this.angle < -Math.PI)
        this.angle += Math.PI * 2;

      if (this.angle > -Math.PI / 4 && this.canScoreBackflip && aqua.game.score) {
        this.canScoreBackflip = false;
        aqua.game.score.addTrick('Backflip', 50000);
      }

      this.ax = 0;
      this.ay = 0;
      
      var fadeHappy = this.fadeHappy = Math.clamp((this.x - this.world.box.left - this.world.box.width / 2) / 40, 0, 1);
      var fadeApproach = this.fadeApproach = Math.clamp((this.x - 240 + this.y / 8 - this.world.box.left) / (this.world.box.width / 6), 0, 1);
      
      if (this.fadeApproach === 0) {
        this.inDanger = true;
      }
      
      if (this.fadeApproach == 1 && this.inDanger) {
        this.inDanger = false;
        
        if (aqua.game.score) {
          aqua.game.score.addTrick('Back for More', 50000);
        }
      }
      
      // if (this.sound.nodes) {
      //   if (this.sound.nodes.happy)
      //     this.sound.nodes.happy.source.gain.value = Math.clamp(Math.lerp(0, 1, fadeHappy), 0, 1);
      //   if (this.sound.nodes.zone) {
      //     this.sound.nodes.zone.source.gain.value = Math.clamp(Math.lerp(0, 1, Math.lerp((1-fadeHappy), 0, 1-Math.sqrt(fadeApproach))), 0, 1);
      //   }
      //   if (this.sound.nodes.approach) {
      //     this.sound.nodes.approach.source.gain.value = Math.clamp(Math.lerp(1, 0, fadeApproach), 0, 1);
      //   }
      // }
      
      if (this.world.box.contains([this.x, this.y])) {
        if (fadeApproach > 0) {
          this.score += fadeHappy * this.gameObject.game.timing.delta * 1000;
          this.score += (1 - fadeHappy) * this.gameObject.game.timing.delta * 10000;
        }
      }
      
      if (Date.now() - this.heatmapTime > 10000) {
        // Playtomic.Log.Heatmap('Position', '0001', this.x - this.world.box.left, this.y);
        this.heatmapTime = Date.now();
      }
      
      if (!(
        this.world.box.contains([this.x+this.radius,this.y+this.radius]) ||
        this.world.box.contains([this.x+this.radius,this.y-this.radius]) ||
        this.world.box.contains([this.x-this.radius,this.y+this.radius]) ||
        this.world.box.contains([this.x-this.radius,this.y-this.radius]))) {
        
        if (aqua.game.score) {
          if (this.world.box.bottom > this.y) {
            aqua.game.score.addTrick('The World is Flat', 10000);
          } else if (this.world.box.top < this.y) {
            aqua.game.score.addTrick('To The Sky', 200000);
          } else if (this.world.box.right < this.x) {
            aqua.game.score.addTrick('Exit Stage Right', 1000000);
          } else if (this.world.box.left > this.x) {
            aqua.game.score.addTrick('Exit Stage Left', 100000);
          }
        }
        
        // Playtomic.Log.Heatmap('Death', '0001', this.x - this.world.box.left, this.y);
        
        this.gameObject.game.destroy(this.gameObject);
        
        var resetObject = aqua.GameObject.create();
        resetObject.add(GliderReset.create(this.gameObject.get(GliderInput)));
        this.gameObject.game.add(resetObject);
      }
    }
  }
);

var GliderScore = aqua.type(aqua.Component,
  {
    init: function() {
      this.score = 0;
      this.playerName = localStorage && localStorage.playerName || 'Player';
      this.bestScore = localStorage && localStorage.best && parseInt(JSON.parse(localStorage.best || '{}')[this.playerName], 10) || 0;

      this.zoneTime = 0;
      this.zoneDiv = null;

      this.tricks = [];

      when(load.text('locale/en/tricks.json'), (function(text) {
        this.titles = JSON.parse(text);
      }).bind(this));
      
      $((function() {
        this.modes = {
          all: $('#scoremode div'),
          nameDiv: $('#scoremode div.name'),
          bestDiv: $('#scoremode div.best'),
          currentDiv: $('#scoremode div.current'),
          worldBestDiv: $('#scoremode div.world')
        };
        
        this.modes.nameDiv.click(this.onmodeclick.bind(this,{
          div: this.modes.nameDiv,
          setter: function(div) {},
          init: function(div) {
            div.text(this.playerName);
            div.attr('contenteditable', true);
            div.attr('spellcheck', false);
            
            if (div.text() == 'Player') {
              div.focus();
              document.execCommand('selectAll');
            }
            
            div.on('keydown', function(e){
              if (e.keyCode == 91 || e.keyCode == 13) {
                e.preventDefault();
                div.blur();
              }
            });
            
            div.blur((function() {
              if (div.text().trim() === '') {
                div.text('Player');
              }
              localStorage.playerName = div.text();
              
              // if stored name and current name are different load best
              if (localStorage.playerName != this.playerName) {
                this.playerName = localStorage.playerName;
                this.bestScore = JSON.parse(localStorage.best || '{}')[this.playerName] || 0;
              }
            }).bind(this));
          }
        }));
        this.modes.bestDiv.click(this.onmodeclick.bind(this,{
          div: this.modes.bestDiv,
          init: function(div) {
            div.find('.value').text(parseInt(this.bestScore, 10));
            // Playtomic.Leaderboards.SaveAndList(
            //   {
            //     Name: this.playerName,
            //     Points: parseInt(this.bestScore, 10)
            //   },
            //   'score',
            //   this.showRank.bind(this, this.playerName, parseInt(this.bestScore, 10)),
            //   {
            //     allowduplicates: false
            // });
          }
        }));
        this.modes.currentDiv.click(this.onmodeclick.bind(this,{
          div: this.modes.currentDiv,
          setter: function(div) {
            div.text(parseInt(this.score, 10));
          },
          init: function(div) {
            if (this.move) {
              // Playtomic.Leaderboards.SaveAndList(
              //   {
              //     Name: this.playerName,
              //     Points: parseInt(this.score, 10)
              //   },
              //   'score',
              //   this.showRank.bind(this, this.playerName, parseInt(this.score, 10)),
              //   {
              //     allowduplicates: false
              // });
            }
          }
        }));
        this.modes.worldBestDiv.click(this.onmodeclick.bind(this,{
          div: this.modes.worldBestDiv,
          init: function(div) {
            div.find('.value').text('loading');
            
            // Playtomic.Leaderboards.List('score', (function(list){
            //   div.find('.value').text(list[0].Points);
            //   div.find('.rank').html('1st' + '&nbsp;' + list[0].Name);
            // }).bind(this));
          },
          setter: null
        }));
        
        if (this.playerName == 'Player') {
          this.modes.nameDiv.click();
        } else {
          this.modes.currentDiv.click();
        }
      }).bind(this));
    },
    onmodeclick: function(options) {
      var div = options.div,
          scoreSetter = options.setter || function() {},
          scoreStart = options.init;
      
      if (!div.hasClass('off')) return;

      this.modes.all.addClass('off');
      div.removeClass('off');

      var scoreDiv = $('.score'), newScoreDiv;

      if (scoreDiv.length === 0) {
        newScoreDiv = $(
          '<div class="score">'+
          '<div class="value">0</div>'+
          '<div class="rank"></div></div>').insertAfter('#scoremode');
      } else {
        newScoreDiv = $('<div class="score start"><div class="value">0</div><div class="rank"></div></div>').insertAfter('.score');
        setTimeout(function(){
          newScoreDiv.removeClass('start');
        }, 0);
      }

      if (typeof scoreStart == 'function') {
        scoreStart.call(this, newScoreDiv);
      }

      scoreDiv.addClass('off');
      if (scoreDiv[0] && scoreDiv[0].interval) {
        clearInterval(scoreDiv[0].interval);
        setTimeout(function(){
          scoreDiv.remove();
        }, 500);
      }
      
      newScoreDiv[0].interval = setInterval(
        scoreSetter.bind(this,newScoreDiv.find('.value')), 50);
      scoreSetter.call(this,newScoreDiv.find('.value'));
    },
    showRank: function(name, score, list) {
      var rankDiv = $('.score:last .rank'),
          suffixes = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'];
      if (!list) {
        // Playtomic.Leaderboards.List('score', function(list) {
        //   rankDiv.html(list[0].Rank + suffixes[list[0].Rank % 10] + '&nbsp;' + list[0].Name );
        // }, {
        //   customfilters: {
        //     'Name': name,
        //     'Points': score
        //   }
        // });
      } else if ( typeof list.Success == 'undefined' ) {
        for ( var i = 0; i < list.length; i++ ) {
          if ( list[i].Name == name && list[i].Points == score ) {
            rankDiv.html( list[i].Rank + suffixes[list[i].Rank % 10] + '&nbsp;' + list[i].Name );
            break;
          }
        }
      }
    },
    setMove: function(move) {
      this.move = move;

      // submit score to leaderboard
      if (move == null) {
        var scoreObj = {
          'Name': this.playerName,
          'Points': parseInt(this.score, 10),
          'CustomData': {
            'Name': this.playerName,
            'Points': parseInt(this.score, 10),
            'StartTime': this.startTime,
            'EndTime': Date.now()
          }
        },
        callback = this.showRank.bind(this, this.playerName, parseInt(this.score, 10));

        if (this.modes.currentDiv.hasClass('off')) {
          callback = function(){};
        }

        // Playtomic.Leaderboards.SaveAndList.call(
          // eval(atob('UGxheXRvbWljLkxlYWRlcmJvYXJkcw==')),
          // scoreObj,
          // "score", 
          // callback,
          // {
          //   allowduplicates: false
          // });
      } else {
        this.startTime = Date.now();
      }

      if (move == null && this.score > this.bestScore && localStorage) {
        this.bestScore = this.score;
        
        var best = JSON.parse(localStorage.best || '{}') || {};
        best[this.playerName] = this.bestScore;
        
        localStorage.best = JSON.stringify(best);
      }

      if (move)
        this._clear();
    },
    _clear: function() {
      var tricks = this.tricks,
          count = tricks.length,
          i;

      for ( i = 0; i < count; i++ ) {
        this.removeTrick(tricks[i]);
      }

      this.score = 0;
      this.zoneTime = 0;
      this.zoneTimeAwarded = 0;
      this.zoneDiv = null;
    },
    getLocale: function(name) {
      if (this.titles && this.titles[name]) {
        name = this.titles[name][parseInt(Math.random() * this.titles[name].length - 1, 10)];
      }
      return name;
    },
    addTrick: function(name, points, time) {
      if (time == null) time = 2;

      this.score += points;

      // Playtomic.Log.LevelCounterMetric(
        // name.match(/^\d+s/) ? 'in the Zone' : name, 
        // '0001');

      if (this.titles && this.titles[name]) {
        name = this.titles[name][parseInt(Math.random() * this.titles[name].length - 1, 10)];
      }

      name = name.replace(/ /g, '&nbsp;');

      var trick = $(
        '<div class="trick" style="top:' + (32 + this.tricks.length * 14) + 'px;"><div class="value">'+
          points+
        '</div><div class="name">'+
          name+
        '</div></div>').appendTo(this.stuntDiv);

      trick.find('.name').css(
        'right', 
        -trick.find('.name').width() - 5);

      trick.time = time;
      trick.points = points;

      this.tricks.push(trick);
    },
    removeTrick: function(trickDiv) {
      if (!trickDiv.removing) {
        trickDiv.removing = true;
        
        trickDiv.css('opacity', 0);
        setTimeout((function(trickDiv) {
          trickDiv.remove();

          var index = this.tricks.indexOf(trickDiv);
          if (index != -1) {
            this.tricks.splice(index, 1);
          }
        }).bind(this, trickDiv), 500);
      }
    },
    ongameadd: function(gameObject, game) {
      this.world = game.world;
    },
    ongamedestroy: function() {
      delete this.tricks;
    },
    addZoneTrick: function() {
      this.zoneTime = parseInt(this.zoneTime * 10, 10) / 10;
      this.addTrick(this.zoneTime + 's ' + this.getLocale('in the Zone'), this.zoneTime * 10000);
      
      // Playtomic.Leaderboards.Save({
      //   Name: this.playerName,
      //   Points: this.zoneTime * 10
      // }, "ZoneTime");
      
      // Playtomic.Log.LevelAverageMetric('ZoneTime', '0001', this.zoneTime * 10);
    },
    fixedUpdate: function() {
      var delta = this.gameObject.game.timing.fixedDelta;
      var stuntDiv = this.stuntDiv,
          scoreDiv = $('.score:last'),
          scoremodeDiv = $('#scoremode'),
          zoneDiv = this.zoneDiv;
      
      if (!stuntDiv) {
        stuntDiv = this.stuntDiv = $('#stunts');
      }
      
      if (this.move && this.world.box.contains([this.move.x, this.move.y])) {
        if (this.move.fadeApproach > 0) {
          this.score += this.move.fadeHappy * delta * 1000;
          this.score += (1 - this.move.fadeHappy) * delta * 10000;
        
          // in the zone
          if (this.move.fadeHappy === 0) {
            this.zoneTime += delta;
            
            if (this.zoneTime - this.zoneTimeAwarded > 5) {
              this.zoneTimeAwarded += 5;
              
              this.addTrick(this.zoneTimeAwarded + 's ' + this.getLocale('in the Zone'), this.zoneTimeAwarded * 10000);
            }
          } else {
            if (this.zoneTime) {
              this.addZoneTrick();
            }
            
            this.zoneTime = 0;
            this.zoneTimeAwarded = 0;
          }
        } else {
          if (this.zoneTime) {
            this.addZoneTrick();
          }
          
          this.zoneTime = 0;
          this.zoneTimeAwarded = 0;
        }
      
        if (this.zoneTime > 0 && !this.zoneDiv) {
          zoneDiv = this.zoneDiv = $('<div class="trick zone">0s</div>').appendTo(stuntDiv);

          this.tricks.splice(0, 0, zoneDiv);
        }
        if (this.zoneTime === 0 && this.zoneDiv) {
          delete this.zoneDiv;

          zoneDiv.time = 2;
          
          zoneDiv = null;
        }
      } else {
        if (this.zoneDiv) {
          delete this.zoneDiv;
          
          zoneDiv.time = 0;
          
          zoneDiv = null;
        }
      }
      
      if (zoneDiv) {
        zoneDiv.text(parseInt(this.zoneTime * 10, 10) / 10 + 's');
      }
      
      for ( var i = 0; i < this.tricks.length; i++ ) {
        var trickDiv = this.tricks[i];
        trickDiv.css('top', 32 + i * 14);

        if (trickDiv.time != null) {
          trickDiv.time -= delta;
          if (trickDiv.time <= 0) {
            this.removeTrick(trickDiv);
          }
        }
      }

      if (scoreDiv) {
        stuntDiv.css('left', (window.innerWidth - scoreDiv.width()) / 2);
      }
      
      var lastmode = scoremodeDiv.find('div:eq(1)').css('right', (window.innerWidth / 2) + 6);
      lastmode = scoremodeDiv.find('div:eq(0)').css('right', (window.innerWidth / 2) + 12 + lastmode.width());
      lastmode = scoremodeDiv.find('div:eq(2)').css('left', (window.innerWidth / 2) + 3);
      scoremodeDiv.find('div:eq(3)').css('left', (window.innerWidth / 2) + 9 + lastmode.width());
    }
  }
);

var GliderRender = aqua.type(aqua.Component,
  {
    onadd: function(gameObject) {
      this.move = gameObject.get(GliderMove);
    },
    ongameadd: function(gameObject, game) {
      this.drawCall = aqua.PriorityItem.create(this.draw.bind(this));
      game.graphics.addDrawCall(this.drawCall);
    },
    ongamedestroy: function(gameObject, game) {
      game.graphics.removeDrawCall(this.drawCall);
    },
    draw: function(graphics, gl) {
      if (!this.buffer) {
        this.buffer = gl.createBuffer();
        this.arrayBuffer = new ArrayBuffer(4 * 4 * 3);
        this.floatView = new Float32Array(this.arrayBuffer);
      }
      
      var floatView = this.floatView,
          angle = this.move.angle,
          x = this.move.x,
          y = this.move.y,
          radius = this.move.radius,
          shader = graphics.shaders.basic;
      
      gl.disable(gl.BLEND);
      
      graphics.useShader('basic');
      
      if (!shader.matrixLocation) {
        shader.matrixLocation = gl.getUniformLocation(shader.program, 'modelview_projection');
        shader.texture0Location = gl.getUniformLocation(shader.program, 'texture0');
        shader.colorLocation = gl.getUniformLocation(shader.program, 'color');
        
        shader.positionLocation = gl.getAttribLocation(shader.program, 'a_position');
        shader.texcoord0Location = gl.getAttribLocation(shader.program, 'a_texcoord0');
        
        gl.enableVertexAttribArray(shader.positionLocation);
        gl.enableVertexAttribArray(shader.texcoord0Location);
      }
      
      floatView[0] = x + Math.cos(angle) * radius;
      floatView[1] = y + Math.sin(angle) * radius;
      
      floatView[4] = x + Math.cos(angle + Math.PI) * radius;
      floatView[5] = y + Math.sin(angle + Math.PI) * radius;
      
      floatView[8] = floatView[4] + Math.cos(angle - Math.PI / 4 * 3) * radius / 3 * 2 * Math.lerp(0.7, 1, Math.random());
      floatView[9] = floatView[5] + Math.sin(angle - Math.PI / 4 * 3) * radius / 3 * 2 * Math.lerp(0.7, 1, Math.random());
      
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, floatView, gl.DYNAMIC_DRAW);
      
      gl.uniformMatrix4fv(shader.matrixLocation, false, graphics.projection);
      gl.uniform4f(shader.colorLocation, 255 / 255, 90 / 255, 48 / 255, 255 / 255);
      gl.uniform1i(shader.texture0Location, 0);
      
      gl.vertexAttribPointer(shader.positionLocation, 2, gl.FLOAT, false, 4 * 4, 0);
      gl.vertexAttribPointer(shader.texcoord0Location, 2, gl.FLOAT, false, 4 * 4, 2 * 4);
      
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }
);

glider.GliderScore = GliderScore;
glider.GliderReset = GliderReset;

glider.GliderInput = GliderInput;
glider.GliderMove = GliderMove;
glider.GliderRender = GliderRender;

glider.makeGlider = function(gameObject) {
  gameObject = gameObject || aqua.GameObject.create();

  gameObject.add(GliderInput.create({
    87: 'up', // w
    38: 'up', // up arrow
    32: 'up' // space
  }));
  gameObject.add(GliderMove.create());
  gameObject.add(GliderRender.create());

  return gameObject;
};

});
})(this, this.load);