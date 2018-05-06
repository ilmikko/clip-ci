// This object triest ot aggregate all the properties into one working format,
// as implementations sometimes vary.
function Video(src){
  this.src=src;
  this.element=$('>video').addClass('full').set({preload:"auto",playsinline:'',muted:''});
}
Video.prototype={
  _toAlt:function(){
    return this.element;
  },
  preplay:function(callback,update){
    // Make sure we won't stutter on play start, so we play the video for a
    // couple of seconds beforehand.

    var bufferAmount=5; // seconds

    var self=this;

    var once=false;
    function success(){
      if (once) return; else once=true;

      self.element
        .pause()
        .prop({currentTime:0})
        .off('timeupdate')
        .off('ended');

      callback();
    }

    this.element
      .prop({playbackRate:5})
      .on('timeupdate',function(){
        var currentTime=this.e.currentTime;

        if (currentTime>=bufferAmount||currentTime>=this.e.duration){
          success();
        }else{
          update(currentTime/bufferAmount);
        }
      })
      .one('ended',function(){success();})
      .play();
  },
  prepare:function(callback){
    // Make sure this video is playable

    // TODO: should there be an update callback?

    var self=this;
    var timeout=1000; // milliseconds

    // Automatic retry as some browsers hiccup on the loading sometimes (I know)
    function retry(){
      // Wait a while until retrying
      var timeoutObject=setTimeout(function(){
        var readyState=self.element.e.readyState;

        console.warn(self.src+" is taking a while to load. (readyState="+readyState+")");
        if (readyState==0) retry();
      },timeout);

      self.element
        .on("error",function(err){
          clearTimeout(timeoutObject);
          if (player) player.error(err.message);
        })
        .one("canplaythrough",function(){
          clearTimeout(timeoutObject);
          if (callback) callback();
        })

        .set({src:self.src+"?random="+Math.random()})
        .load();
    }
    retry();
  }
};
