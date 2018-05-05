function LoadingHandler(id){
  this.id=id;
  this.reset();
}
LoadingHandler.maxSimultaneousDownloads=2;
LoadingHandler.prototype={
  start:function(id){
    if (this.finished) console.warn('Race finished, but someone started!');
    this.pending++;
    console.log("STARTED: "+this.id+"["+id+"] ("+this.pending+")");
    this.update(id,0);
  },
  queue:function(callback){
    this.queuelist.push(callback);
    if (this.pending<LoadingHandler.maxSimultaneousDownloads&&this.queuelist.length) this.queuelist.shift()();
  },
  update:function(id,progress){
    this.progress[id]=progress;
    this.fire('update',{progress:this.getProgress()});
  },
  end:function(id){
    if (this.finished) console.warn('Race finished, but someone ended! ('+id+')');
    this.pending--;
    this.update(id,1);
    console.log("ENDED: "+this.id+"["+id+"] ("+this.pending+")");
    if (this.pending<LoadingHandler.maxSimultaneousDownloads&&this.queuelist.length) this.queuelist.shift()();
    else if (this.pending==0) this.finish();
  },
  reset:function(){
    this.progress={};
    this.pending=0;
    this.error=false;
    this.finished=false;
    this.queuelist=[];
    this.callbacks={
      finish:[],
      update:[]
    };
  },
  getProgress:function(){
    // Calculate our total progress
    var sum=0,count=this.queuelist.length;
    for (var p in this.progress){
      count++;
      sum+=this.progress[p];
    }

    if (count==0) return 0;

    return sum/count;
  },
  finish:function(){
    this.finished=true;
    console.log("FINISHED: "+this.id+" ("+this.pending+")");

    // Fake 100% progress and fire final progress event
    this.fire('update',{progress:1});

    this.fire('finish');
  },
  fire:function(name,evt){
    evt=evt||{};
    if (this.error) return;
    var cbs=this.callbacks[name];
    for (var g=0,glen=cbs.length;g<glen;g++) cbs[g](evt);
  },
  on:function(name,callback){
    this.callbacks[name].push(callback);
  }
};
