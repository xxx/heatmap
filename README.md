heatmap
=======

Some javascript/canvas/web worker heatmap experimentation.

Play along online at [http://heatmapthing.heroku.com](http://heatmapthing.heroku.com).

You'll need to use a browser that supports canvas and web workers. Right now that means Firefox, Safari, Chrome, or Opera.

Installation
============

None. Just run `rackup` in the root directory if you want to use rack, or open `heatmap.html` in a browser directly.

If you're using Google Chrome (or Chromium) and want to open heatmap.html directly, you'll need to start Chrome from the command line and pass `--allow-file-access-from-files` as an argument, or the worker will fail to spawn.

Use
===

Giant hacks alert. This is just a demo.

Mouseover and click the image, then render to see the heat. Smoothing is very slow in some browsers. Heat data can be imported and exported via the textarea. Heat is collected by default on page load.

Copyright
=========

Copyright (c) 2010-2011 Michael Dungan, mpd@jesters-court.net, released under the MIT license

The included image was found at http://imgur.com and NOT covered under the above license. The creator is unknown, as are the license terms.
