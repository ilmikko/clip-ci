function Scene(id,type,o){
  this.id=id;
  this.type=type;

  if (!o.play) o.play=[]; else if (!(o.play instanceof Array)) o.play=[o.play];
  this.videos=o.play;

  if (!o.ratio) o.ratio=null; else if (o.ratio.length!==o.videos.length) return error('Ratio lengths do not match in scene '+id);
  this.ratio=o.ratio;

  this.next=o.next;
  this.controls=o.controls||[];
}
Scene.prototype={
  pop:function(){
    // Get next video according to ratio. If ratio is false, pick one at random.
    var vids=this.videos,length=vids.length;

    if (length==1) return vids[0];

    var random=Math.random();
    if (this.ratio){
      var ratio=this.ratio;
      for (var i=length,sum=0;i--;) sum+=ratio[i];
      var pointer=random*sum;
      for (var id=0,sum=0;sum<pointer;) sum+=ratio[id++];

      return vids[id-1];
    }else return vids[Math.floor(random*length)];
  }
};
Scene.create=function(id,type,o){
  o=o||{};
  return new Scene(id,type||"straight",o);
}
