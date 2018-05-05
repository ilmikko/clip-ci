var player=(function(){
	var $player=null;

	console.log("Hello, this is a debug version of the player");

	var PRELOAD=new LoadingHandler('PRELOAD'),PREPARING=new LoadingHandler('PREPARING'),LOADING=new LoadingHandler('LOADING');

	var videos={},currentvideo,previousvideo;
	function Video(id,src){
		this.id=id;
		this.src=src;
		this.element=$('>video').addClass('full').set({preload:"auto",playsinline:'',muted:''});
	}
	Video.prototype={
		_toAlt:function(){
			return this.element;
		},
		show:function(){
			this.element.css({zIndex:1});
		},
		hide:function(){
			this.element.css({zIndex:0})
				.prop({currentTime:0});
		},
		stop:function(){
			this.element
				.pause()
				.css({zIndex:0}); // Do this so we won't be taking prime time from playing videos
		},
		preplay:function(){
			// Preplay 5 or so seconds so we don't stutter when we need to play these videos for real
			var bufferAmount=5; // seconds

			var self=this;

			LOADING.queue(function(){
				LOADING.start('pre-'+self.id);

				function success(){
					self.element
						.pause()
						.prop({currentTime:0})
						.off('timeupdate')
						.off('ended');

					LOADING.end('pre-'+self.id);
				}

				self.element
					.prop({playbackRate:5})
					.on('timeupdate',function(){
						var currentTime=this.e.currentTime;
						if (currentTime>=bufferAmount||currentTime>=this.e.duration){
							success();
						}else{
							LOADING.update('pre-'+self.id,currentTime/bufferAmount);
						}
					})
					.one('ended',function(){success();})
					.play();
			});
		},
		ready:function(){
			// Ready for playing this video for real
			this.element
				.prop({playbackRate:1,currentTime:0})
				.on("ended",function(){
					// The video has ended, check queue
					iteration();
				});
		},
		prepare:function(){
			var self=this;
			PREPARING.queue(function(){
				PREPARING.start('prepare-'+self.id);

				self.element
					.on("error",function(err){
						error(err.message);
					})
					.one("canplaythrough",function(){
						console.log("VIDEO PREPARED: ->"+self.src);
						PREPARING.end('prepare-'+self.id);
					})

					.set({src:self.src})
					.load();
			});
		}
	};

	function attach(playerElement){
		// Attach player to this specific element.
		$player=$(playerElement);

		// Get our control locations
		for (var g in controllocations) controllocations[g]=$player.$('.controls-'+g); // Get all our control locations

		$player.$('.controls')
			.on('click',function(){
				// Click displays the controls in case they're hidden
				toggleControls(true);
			});

		$player.$('.videos')
			.on('dblclick',function(){
				// Toggle fullscreen on double click
				toggleFullscreen();
			});

		// Remove click propagation from all the inputs in controls
		// TODO: is this needed?
		$player.$('.controls button,input').on('click',function(evt){
			evt.stopPropagation();
		});
	}

	var controllocations={'nw':1,'n':1,'ne':1,'w':1,'c':1,'e':1,'sw':1,'s':1,'se':1};
	var blueprints={
		'control-replay':function(){
			return $('>button')
				.addClass('icon-text','large','scene')
				.set({name:'replay'})
				.text('Replay?')
				.on('click',function(){
					controls.changeScene(startscene.id);
				});
		},
		'control-pause':function(){
			return $('>button')
				.addClass('control-pause')
				.append(
					$('>span').class('icon').set({name:'pause'})
				)
				.on('click',function(evt){
					evt.stopPropagation();
					togglePlaying();
				});
		},
		'control-speed':function(o){
			// Revised speed control...

			var slider = verticalSlider({
				min: o.min||0.5,
				mid: o.mid||1,
				max: o.max||3
			})
			.on('change',function(){
				changeSpeed(this.value(),true);
			})
			.on('input',function(){
				changeSpeed(this.value());
			});

			var popup = $('>div')
			.addClass('popup','hidden','fade')
			.append(slider);

			var button = $('>button')
			.addClass('control-speed')
			.append(
				$('>span').class('icon').set({name:'speed'})
			)
			.on('click',function(evt){
				evt.stopPropagation();

				if (popup.hasClass('hidden')){
					// Show the popup
					popup.removeClass('hidden');

					// But hide it as soon as we click somewhere else
					$(document.body).one('click',function(){
						popup.addClass('hidden');
					});
				}
			});

			return $('>div')
			.addClass('button-popup')
			.append(
				popup,
				button
			);
		},
		'control-hide':function(){
			return $('>button')
				.addClass('control-hide')
				.append(
					$('>span').class('icon').set({name:'hide'})
				)
				.on('click',function(evt){
					evt.stopPropagation();
					toggleControls();
				});
		},
		'control-fullscreen':function(){
			return $('>button')
				.addClass('control-fullscreen')
				.append(
					$('>span').class('icon').set({name:'fullscreen'})
				)
				.on('click',function(evt){
					evt.stopPropagation();
					toggleFullscreen();
				});
		},
		'button':function(o){
			o=o||{};

			if (!o.delay) o.delay=150;
			var button=$('>button')
				.addClass('scene')
				.css({opacity:0})
				.prop({disabled:true});

			var text=o.text||'';

			button.text(text);

			if (o.class) button.class(o.class);

			if (o.scene){
				button
					.on('click',function(evt){
						evt.stopPropagation();
						controls.changeScene(o.scene);
					});
			} else console.warn('Button without scene!');

			setTimeout(function(){
				button.css({opacity:1}).prop({disabled:false});
			},o.delay);

			return button;
		}
	};

	// SCENES
	var scenes={},ids={},playlist=[],currentscene,startscene;
	function Scene(id,type,o){
		o=o||{};

		this.id=id;
		this.type=type;

		this.videos=o.videos||[];

		if (!o.ratio) o.ratio=null; else if (o.ratio.length!==o.videos.length) {
			console.warn('Ratio lengths do not match in scene '+id);
			o.ratio=null;
		}
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
		return new Scene(id,type||"straight",o);
	}

	function loadBackground(src,callback){
		$player.$('.bg-thumb')
			.on('error',function(evt){
				error('Background image error');
			})
			.one('load',callback)
			.set({src:src});
	}

	function loadFakeVideo(src,callback){
		console.log("Loading fake video...");

		// TODO: Create a try-fix for older versions of Firefox, and unify this (why can't we have a new Video()?)

		// Created a catch-all function because there are a ton of implementations
		var fired=false;
		function loaded(){
			// This function is only allowed to fire once.
			if (fired) {
				console.warn("Video load was fired multiple times!");
				return;
			}

			fired=true;

			this.off('canplaythrough').off('canplay').removeClass('hidden');
			console.log("Fake video loaded!");
			callback();
		}

		var video = $player.$(".background > video.fake")
			.one('canplaythrough',loaded)
			.one('canplay',loaded)
			.one('load',loaded)
			.on('error',function(){
				error("Video playback error");
			})
			.set({src:src});

		if (video.e.readyState > 3){
			console.log("Immediate fire");
			loaded();
		}
	}

	function loadStartScene(scene,callback){
		// loadSceneStart prioritizes in displaying the scene ASAP.
		var scene=loadScene(scene);

		startscene=scene;

		changeScene(scene,true);

		var firstvideoid=scene.pop();
		if (firstvideoid){
			loadFakeVideo(ids[firstvideoid],callback);
		}
	}

	function addVideoToVideos(video){
		$player.$(".videos").append(video);
	}

	function clearVideos(){
		$player.$(".videos").clear();
	}

	function resetControls(){
		$player.$(".controls .tbt .tbt").clear();
	}

	function resetSceneControls(){
		$player.$(".controls .scene").remove();
	}

	function hideLoading(){
		$player.$('.loading > .full')
			.addClass('hidden')
	}

	function showLoadingProgressBar(text){
		hideLoading();

		var wrapper = $('.loading-text');
		wrapper.removeClass('hidden').$('h2').text(text);
	}

	function showLoadingLoadButton(click){
		var wrapper = $player.$('.loading-button');

		wrapper.removeClass('hidden');
		wrapper.$('button')
			.off('click')
			.one('click',function(){
				hideLoading();
			})
			.one('click',click);
	}

	function updateLoadingProgressBar(progress){
		progress=(progress*100).toFixed(2);
		$player.$('.loading-bar').css({width:(progress)+"%"});
	}

	function blurPlayer(){
		$player.$(".post").addClass('hidden');
	}

	function focusPlayer(){
		$player.$(".post").removeClass('blurred');
	}

	function hideThumb(){
		$player.$(".background > .bg-thumb").addClass('hidden');
	}

	function showThumb(){
		$player.$(".background > .bg-thumb").removeClass('hidden');
	}

	function preloadHideFake(){
		$player.$(".background > video.fake")
			.addClass('blurred')
	}

	function preloadSwapFake(){
		$player.$(".post").removeClass('hidden')
	}

	function hideSceneButtons(){
		$player.$("button.scene")
			.css({opacity:0})
			.prop({disabled:true});
	}

	function changeSpeed(speed,final){
		if (final){
			console.log("Speed change: "+speed);
			// Change for all the videos, not just the current one
			for (var g in videos) videos[g].element.prop({playbackRate:speed});
		}else{
			if (!currentvideo) return; // Nothing's playing, scrubbing shouldn't work.
			currentvideo.element.prop({playbackRate:speed});
		}
	}

	function toggleFullscreen(){
		var e=$player;
		e.fullscreen();
		// Update our fullscreen buttons
		$player.$('.control-fullscreen .icon').set({name:e.isFullscreen()?'fullscreen':'exit-fullscreen'});
	}

	function togglePlaying(){
		if (!currentvideo) return; // Nothing's playing

		var paused=currentvideo.element.prop('paused');

		if (paused){
			currentvideo.element.play();
		}else{
			currentvideo.element.pause();
		}

		$player.$('.control-pause .icon').set({name:!paused?'play':'pause'});
	}

	function toggleControls(force){
		var e=$player.$('.controls');
		if (force==null) {
			e.toggleClass('hidden');
		}else{
			if (force) {
				e.removeClass('hidden');
			}else{
				e.addClass('hidden');
			}
		}

		$player.$('.control-hide .icon').set({name:e.hasClass('hidden')?'show':'hide'});
	}

	function loadControls(arr){
		for (var g=0,gg=arr.length;g<gg;g++){
			var o=arr[g];
			var type=o.type,location=o.location;

			if (!(location in controllocations)) location='s';
			if (type in blueprints) controllocations[location].append(blueprints[type](o));
		}
	}

	function play(id){
		if (id==null) return iteration();
		if (id in scenes){
			console.log('Playing scene '+id);
			changeScene(scenes[id]);
		}else if (id in videos){
			console.log('Playing video '+id);
			changeVideo(videos[id]);
		}else throw new Error('Cannot play "'+id+'": not found');
	}

	function iteration(){
		if (playlist.length){
			console.log("Playing next in playlist");
			play(playlist.shift());
		}else if (currentscene&&currentscene.type==='loop') {
			console.log("Looping loop scene");
			play(currentscene.pop());
		}
	}

	function changeVideo(video){
		// This function is responsible for preventing flashing and hiding the previous videos.
		// If there's something else playing and it's not us, stop that.
		if (currentvideo){
			if (video==null||currentvideo.id!=video.id) {
				currentvideo.stop();
				// If our previous video element is of different id (or undefined), move currentvideo->previousvideo
				if (previousvideo==null||currentvideo.id!=previousvideo.id) {
					// If there was a previousvideo already, hide that entirely. It's behind other elements so there's no flashing.
					if (previousvideo) previousvideo.hide();
					previousvideo=currentvideo;
				}
			}
		}
		currentvideo=video;
		if (currentvideo){
			currentvideo.show();
			currentvideo.element.play();
		}
	}

	function queue(){
		Array.prototype.push.apply(playlist,arguments);
	}

	function changeScene(scene,doNotPlay){
		if (currentscene) console.warn("Change scene from %s to %s",currentscene.id,scene.id);

		playlist=[];

		currentscene=scene;

		if (currentscene.videos.length>0){
			// Queue a video from the scene
			queue(currentscene.pop());
		}else{
			// Queue a 'null' video, meaning no video should be playing during this empty scene
			changeVideo();
		}

		if (scene.next){
			console.log("Next scene found, queueing that after...");
			queue(scene.next);
		}

		// update our controls
		resetSceneControls();
		loadControls(currentscene.controls);

		if (!doNotPlay) iteration();
	}

	function resetPlayerElements(){
		hideLoading();
		clearVideos();
		resetControls();
		blurPlayer();
		preloadHideFake();
		hideThumb();
	}

	function reset(){
		// Reset elements
		resetPlayerElements();

		// Reset objects
		startscene=currentscene=previousvideo=currentvideo=null;
		playlist=[];
		videos={};
		scenes={};
		ids={};

		PRELOAD.reset();
		PREPARING.reset();
		LOADING.reset();
	}

	function error(msg){
		console.error('Playback error: '+msg);

		// Make sure we won't finish loading. :<
		PRELOAD.error=PREPARING.error=LOADING.error=true;

		blurPlayer();
		hideLoading();
		showLoadingProgressBar('Playback Error :<');
	}

	function prepareVideo(id,src){
		if (id in videos) return console.log('Video '+id+' already loaded.');

		var video=new Video(id,src);
		videos[id]=video;

		video.prepare();

		addVideoToVideos(video);

		return video;
	}

	function loadScene(scene){
		var id=scene.id;
		if (id in scenes) {
			console.log('Scene '+id+' already loaded.');
			return scenes[id];
		}

		return scenes[id]=scene;
	}

	function preload(o){
		PRELOAD.on('finish',function(){
			console.log('Preload done');
			showThumb();
			preparing(o);
		});

		// Load the video ids first
		if ('ids' in o){
			for (var g in o.ids) ids[g]=o.ids[g];
		}

		// bg: colors at the background
		if (o.bg) {
			PRELOAD.start('bg');
			loadBackground(o.bg,function(){
				PRELOAD.end('bg');
			});
		}

		// Load the start scene first so we can stop displaying darkness
		if ('start' in o){
			if (!(o.start in o.scene)) return error('Start scene '+o.start+' not found');

			PRELOAD.start('startscene');
			loadStartScene(
				Scene.create(o.start,o.scene[o.start].type,o.scene[o.start]),
				function(){PRELOAD.end('startscene');}
			);
		}else error('No start scene!');
	}

	function preparing(o){
		showLoadingProgressBar("Preparing...");

		PREPARING.on('finish',function(){
			console.log('Loading done');

			// Try if we can skip the user input step (desktop UX)
			// Some browsers prevent autoplaying videos, this is for them.

			function skip(){
				loading(o);
			}

			function noskip(){
				hideLoading();

				// Show the play button after a little timeout
				// Wrap the user input nicely in timeouts
				setTimeout(function(){
					showLoadingLoadButton(function(){
						setTimeout(function(){
							loading(o);
						},500);
					});
				},500);
			}

			for (var g in videos){
				g=videos[g].element;
				break;
			}

			if (g){
				var p=g.e.play();
				if (p){
					// p is a promise
					p.then(function(){
						// success, continue fast route
						console.warn('Fast play successful');
						g.pause();
						skip();
						// noskip();
					},function(err){
						// failure
						console.warn(err+' but its okay. Continuing the longer route.');
						g.pause();
						noskip();
					});
				}else{
					// IE, p is not a promise
					// Oh you, IE!
					g.pause();
					noskip();
				}
			}else{
				// Unlikely, but let's not skip
				noskip();
			}
		});

		PREPARING.on('update',function(evt){
			updateLoadingProgressBar(evt.progress);
		});

		// Load at least this long, for debug / visual purposes
		PREPARING.start('wait1s');
		setTimeout(function(){
			PREPARING.end('wait1s');
		},250);

		// Create required elements for controls
		loadControls(o.options||[]);

		// Load the rest of the ids
		for (var g in ids) prepareVideo(g,ids[g]);

		// Load the rest of the loop logic
		if ('scene' in o){
			for (var id in o.scene){
				var options=o.scene[id];
				loadScene(Scene.create(id,options.type,options));
			}
		}
	}

	function loading(o){
		showLoadingProgressBar("Loading...");

		LOADING.on('finish',function(){
			// Wait for a while before we play
			setTimeout(function(){
				// Ready up our videos
				// This happens in the timeout as the last video might still fire an ending event.
				for (var g in videos) videos[g].ready();

				// Finish the loading process, hiding some elements
				hideLoading();

				// Switch thumbnail to the real thing, if available (don't know why it wouldn't be)
				// This is in the timeout to prevent flashing
				if (playlist[0] in videos) videos[playlist[0]].show();

				preloadSwapFake();

				setTimeout(function(){
					// Start the playing process
					iteration();
					focusPlayer();
				},300);
			},250);
		});

		LOADING.on('update',function(evt){
			updateLoadingProgressBar(evt.progress);
		});

		// TODO: Preplay in batches
		for (var g in videos) videos[g].preplay();
	}

	function load(o){
		o=o||{};
		reset();
		preload(o);
	}

	var controls={
		load:function(o){
			load(o);
		},
		attach:function(e){
			attach(e);
		},
		changeScene:function(id){
			if (currentscene&&id==currentscene.id) {
				console.log("changeScene: Scene ID is the same as current scene.");
				return;
			}

			if (!(id in scenes)) {
				console.error("changeScene: Scene ID not found!");
				return;
			}

			// Hide other scene buttons
			hideSceneButtons();

			playlist=[];
			queue(id);

			// If we don't have a video playing, force an iteration. Otherwise we'd never get anywhere (as video end events drive the player forward)
			if (!currentvideo) iteration();
		}
	};

	return controls;
})();
