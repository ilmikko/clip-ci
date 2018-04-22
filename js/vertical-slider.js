// TODO: Clean this up
// TODO: Touch support
function verticalSlider(o){
  o=o || {};

	var thumb = $('>div').addClass('thumb'), track = $('>div').addClass('track');

	var self = $('>div').addClass('vertical-slider');

	function updateSlider(p){
		thumb.css({bottom: (p*100).toFixed(1)+"%"});
	}

  var value=0.5;
	updateSlider(value);

	var drag=function(evt){
    // Get track
		var rect = track.e.getBoundingClientRect();

    // Calculate percentage
		value = 1-(evt.clientY-rect.top)/rect.height;

    // Snap to middle (0.5)
    var epsilon = 0.05;
    if (Math.abs(value-0.5)<epsilon) value=0.5;

    // Clamp to value
		else if (value<0) value=0;
		else if (value>1) value=1;

		updateSlider(value);

		self.fire('input');
	};

	var body=$(document.body);
  self.on('mousedown',function(evt){
    dragging=true;

    // Initial click is also registered
    drag(evt);

    // Enable mouse capture
    body
    .on('mousemove',drag)
    .one('mouseup',function(evt){
  		// Disable mouse capture
      body.off('mousemove',drag);

  		self.fire('change');
  	});
  });

  // Not enough people appreciate this
  self.on('contextmenu',function(evt){
    evt.preventDefault();
    updateSlider(0.5);
    return false;
  });

  var max = o.max || 1;
  var mid = o.mid || 0.5;
  var min = o.min || 0;
  self.extend({
    value:function(){
      // Convert 0..1 to whatever value was specified
      // h(x)=-4 (mid- (max+min)/(2))x^(2)+ (max-min+4 (mid- (max+min)/(2)))x+min

      // Quick maths to get the quadratic value based on min,mid and max
      var b = mid-(max+min)/2;
      return -4*b*value*value+(max-min+4*b)*value+min;
    }
  });

	return self.append(track,thumb)
}
