#!/usr/bin/env bash
# This simple bash script combines the js files into one app.min.js

uglifyjs --compress --mangle -- alt.js loading-handler.js video.js vertical-slider.js player.js > app.min.js
