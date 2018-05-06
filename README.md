# CLIP - Lightweight Interactive Player

_A more accurate description will follow shortly..._

## Feature list TODO:

* Fade in / out support
* Picture in picture
* Varying speeds in scenes / loops

## JSON documentation

The player supports several options that you can pass formatted as JSON.
These options will be the 'barebones' of the animation, and will contain
information about the functionality of the interactive video you want to show.

### Skeleton example

Every JSON needs at least this information.
More information about specific parts will follow.

```
{
  "source":{
    "video1":"/path/to/video1.mp4",
    "video2":"/path/to/video2_loop.mp4",
    ...
  },
  "config":{
    ...
  },
  "struct":{
    "scenes":{
      "scene1":{
        "type":"straight",
        "play":["video1"],
        "next":"scene2"
      },
      "scene2":{
        "type":"loop",
        "play":["video2"]
      },
      ...
    },
    "start":"scene1"
    ...
  }
}
```

### Option `source`

The source section contains all the required information of the source files.

_TODO: The source value could be an array, in which case we will find a format
that works in our player. Currently there is no way to define multiple formats._

For example:
```
...
"source":{
  "video1":"/path/to/video1.mp4",
  "unused_video":"/path/to/other_video.webm"
},
...
```

### Option `config`

The config section contains specific bits of configuration necessary to
customize how the player functions or looks.

Below you can find a list of the options in more detail.

For example:
```
...
"config":{
  "controls":[
    ...
  ],
  ...
}
...
```

#### Config `element` (`config.element`)

The element property contains a single element or an identifier of an element,
that will act as the player element. Usually this does not need to be specified,
as the player element is considered to be the element with ID `player`.
However, in some cases alternate elements are preferred, in which case you can
change this property.

Example usage:
```
"element":document.getElementById("player-id")
```
or
```
"element":"#player-id"
```

#### Config `controls` (`config.controls`)

The controls section contains information which controls are displayed in the
player at all times. For example, you can remove the play/pause button if it is
not needed.

_TODO: The button controls have class 'scene' applied; which means they won't
be displayed at all times. This is a bug that needs to be fixed._

The default value for this section is:
```
"controls":[
  {"type":"control-pause","location":"sw"},
  {"type":"control-speed","location":"sw","min":0.5,"max":3,"default":1},
  {"type":"control-hide","location":"se"},
  {"type":"control-fullscreen","location":"se"}
]
```

Common properties:
`type`
Which type of control this is (please see types below)

`location`
Where this button is located on the controls div.
Please see the locations below.

#### Config `thumb` (`config.thumb`)

The thumb overrides the thumbnail that is by default
the first frame of the first scene. This thumbnail will be shown during the
loading stage, and faded out after loading has been finished.

Example usage:
```
"thumb":"./video/thumb.jpg"
```

#### Config `bg` (`config.bg`)

The thumb overrides the black background that is left when the video is
"letterboxed". You need to specify a path to an image file that is displayed
instead.

_TODO: add options to control blur and darken filters_

Example usage:
```
"bg":"./video/bg.jpg"
```

#### Config `cover` (`config.cover`)

The cover option makes the content cover the entire page instead of being
contained (or "letterboxed") as a regular video element would.
This also applies to the thumbnail media provided.

##### Types

* `control-replay`
Displays a large replay button, which on press plays the first scene again.

* `control-pause`
Displays a play/pause button, which on press toggles video playback.

* `control-speed`
Displays a speed control button, which controls video playback speeds.
`min` - minimum speed in float, when slider is at its lowest position.
`max` - maximum speed in float, when slider is at its highest position.
`mid` - the speed that lies in the middle of the slider, and as a default value.

_TODO: We might want to have default as well, in case it isn't the same as mid_

* `control-hide`
Displays a hide button, which on press toggles the control visibility.

* `control-fullscreen`
Displays a fullscreen button, which on press toggles fullscreen on or off.

* `button`
Displays a button with a custom text.
`text` - set the button text
`class` - set the button CSS class
`scene` - set the scene to travel to when the button is pressed
`delay` - wait this many seconds before displaying the button

##### Locations

The location can be any point of the compass, as any of the following:
`n`,`ne`,`e`,`se`,`s`,`sw`,`w`,`nw`

Or center, denoted by:
`c`

_TODO: Make center controls bigger by default - currently the size is not
determined by the location of the control_

Example usage:
```
...
"location":"nw"
...
```

### Option `struct`

The struct section contains information about the structure of your interactive
video. All the scene logic goes into this section.

For example:
```
...
"struct":{
  "start":"scene1",
  "scenes":{
    ...
  }
}
...
```

#### Structure `start` (`struct.start`)

The start property determines which scene is the starting scene.
Every interactive video needs a starting scene.

Example usage:
```
...
"start":"scene1"
...
```

#### Structure `scenes` (`struct.scenes`)

The scenes property is a dictionary of scenes that the interactive video has.
_TODO: More explanation what a scene is_
An item in this dictionary is defined as follows:

Example usage:
This code below creates a scene called "my_scene".
The scene loops, and plays `video_to_play1` and `video_to_play2`
randomly with a ratio of 1:2.
```
...
"my_scene":{
  "type":"loop",
  "play":["video_to_play1","video_to_play2"],
  "ratio":[1,2],
  "controls":[
    ...
  ]
}
...
```

##### Scene types

There are currently three types of scenes:
`straight` (default)
Plays through the video once, and then either moves to the next scene or stops.
_TODO: Currently doesn't do anything if multiple videos are supplied_

`loop`
Loops through the video(s) until a scene change is triggered.

`empty`
Doesn't play a video at all, but still displays controls.
_TODO: Should empties have a background image?_

##### Other properties

`next`
Works only when the type is set to `straight` - what scene to play next?

`ratio`
In which (approximate) ratio should the videos be played in the video list?
For example, if there are three videos, a value of `[1,5,1]` would cause the
middle video to be played 5 times more than the rest of the two.
Defaults to having an equal ratio for each video.

`play`
The video list to play. If the type is `loop`, videos are randomized from this
list according to the value of `ratio`, or equally in case the ratio is not
supplied.

`controls`
Determines which controls to show when this scene is playing. Please refer to
the section `config.controls` for details about this property, as it follows
the same rules.
