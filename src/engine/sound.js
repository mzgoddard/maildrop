(function(window, load) {

var document = window.document,
    setInterval = window.setInterval,
    clearInterval = window.clearInterval,
    when = window.when,
    aqua = window.aqua;

var SoundContext = aqua.type(aqua.type.Base,
  {
    init: function() {
      this.promises = {};
      this.nodes = {};

      if (window.webkitAudioContext) {
        this.context = new window.webkitAudioContext();

        // var clipsDefer = when.defer();
        // 
        // when.chain(when.all([
        //   when(load.data('music/happy.ogg'), this._loadClip.bind(this, 'happy')),
        //   when(load.data('music/zone.ogg'), this._loadClip.bind(this, 'zone')),
        //   when(load.data('music/approach_danger.ogg'), this._loadClip.bind(this, 'approach')),
        //   when(load.data('music/danger.ogg'), this._loadClip.bind(this, 'danger'))
        // ]), clipsDefer);
        // 
        // clipsDefer.then(this._playAll.bind(this));

        this.nodes = {
          main: this.context.createGain()
        };
        
        this.nodes.main.connect(this.context.destination);
        
        document.addEventListener(
          'webkitvisibilitychange', 
          this.onvisibilitychange.bind(this));
        this.onvisibilitychange();
      }
    },
    onvisibilitychange: function() {
      if (document.webkitVisibilityState == 'visible') {
        if (this.visibilityInterval) {
          clearInterval( this.visibilityInterval );
        }
        
        var destination = 0,
            interval = setInterval((function() {
              this.nodes.main.gain.value = (destination += aqua.game.timing.delta);
              if (destination > 0.1) {
                this.nodes.main.gain.value = 0.1;
                clearInterval(interval);
              }
            }).bind( this ),50);
        this.visibilityInterval = interval;
      } else {
        this.nodes.main.gain.value = 0;
        
        if (this.visibilityInterval) {
          clearInterval(this.visibilityInterval);
        }
      }
    },
    load: function( options ) {
      if ( this.promises[ options.name ] ) {
        return this.promises[ options.name ];
      }

      var promise = when.defer(),
          dataPromise = load.data( options.path ),
          self = this;

      dataPromise.then( function( data ) {
          try {
            self._loadClip( options.name, data );
            promise.resolve( options.name );
          } catch( e ) {
            promise.reject( e );
          }
        },
        promise.reject.bind(promise),
        promise.progress.bind(promise)
      );

      this.promises[ options.name ] = promise;

      return promise;
    },
    _loadClip: function(name, clip) {
      var defer = when.defer();
      this.context.decodeAudioData(clip, function(buffer) {
        var node = this.nodes[name] = {
          buffer: buffer
        };
        defer.resolve();
      }.bind(this), defer.reject);
      return defer.promise;

      // node.source.connect(this.nodes.main);
      // node.source.buffer = node.buffer;
    },
    play: function( name ) {
      if ( this.nodes[ name ] ) {
        var source = this.context.createBufferSource();
        source.buffer = this.nodes[ name ].buffer;
        source.connect( this.nodes.main );
        source.start();
      }
    },
    _playAll: function() {
      this.nodes.happy.source.noteOn(0);
      this.nodes.zone.source.noteOn(0);
      this.nodes.approach.source.noteOn(0);
      
      this.nodes.happy.source.loop = true;
      this.nodes.zone.source.loop = true;
      this.nodes.approach.source.loop = true;
      
      this.nodes.happy.source.gain.value = 0;
      this.nodes.zone.source.gain.value = 0;
      this.nodes.approach.source.gain.value = 0;
    }
  }
);

aqua.SoundContext = SoundContext;

})(this, this.load);