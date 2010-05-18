$(function () {
  var heat = {},
      canvas = $('#overlay'),
      context = canvas.get(0).getContext('2d'),
      cache = { toHue: {}, hueToRGB: {} },
      normalizeHeat,
      smoothHeat,
      renderHeat,
      toHue,
      hueToRGB,
      heatMask,
      clickMask,
      applyMask;
  
  // mask we apply to a point that is moused over.
  heatMask = [
    [0, 1, 0],
    [1, 3, 1],
    [0, 1, 0]
  ];
  
  // mask we apply to a point that is clicked.
  clickMask = [
    [0, 1, 1, 1, 0],
    [1, 3, 3, 3, 1],
    [1, 3, 5, 3, 1],
    [1, 3, 3, 3, 1],
    [0, 1, 1, 1, 0]
  ];

  canvas.attr({
    width: $('#result').width(),
    height: $('#result').height()
  });

  applyMask = function (mask, eventX, eventY) {
    var key, i, j, initialI, initialJ,
      canvasWidth = canvas.attr('width'),
      canvasHeight = canvas.attr('height'),
      maskSeg;

    // mask segment size: (length - 1) / 2, length should be odd
    maskSeg = Math.floor(mask.length / 2);

    initialI = eventX - maskSeg;
    initialJ = eventY - maskSeg;

    for (i = initialI; i <= eventX + maskSeg; i += 1) {
      if (i < 0 || i >= canvasWidth) {
        continue;
      }

      for (j = initialJ; j <= eventY + maskSeg; j += 1) {
        if (j < 0 || j >= canvasHeight) {
          continue;
        }

        key = i + "," + j;
        heat[key] = heat[key] || 0;
        heat[key] += mask[i - initialI][j - initialJ];
      }
    }
  };
  
  $('#trackme').click(function (event) {
    var eventX, eventY;
    eventX = event.pageX - this.offsetLeft;
    eventY = event.pageY - this.offsetTop;
    applyMask(clickMask, eventX, eventY);
  }).mousemove(function (event) {
    var eventX, eventY;
    eventX = event.pageX - this.offsetLeft;
    eventY = event.pageY - this.offsetTop;
    applyMask(heatMask, eventX, eventY);
  });
  
  /*
   * normalize to a 0-255 range
   */
  normalizeHeat = function (heat) {
    var minHeat, maxHeat, heatValues = [], normalizedHeat = {},
        denominator;
    
    $.each(heat, function (key, value) {
      heatValues.push(value);
    });
    
    minHeat = Math.min.apply(window, heatValues);
    maxHeat = Math.max.apply(window, heatValues);
    
    denominator = maxHeat - minHeat;
    
    if (denominator === 0 || denominator === Number.NEGATIVE_INFINITY) {
      denominator = 1;
    }
    
    $.each(heat, function (key, value) {
      normalizedHeat[key] = Math.floor(255 * ((value - minHeat) / denominator));
    });
    
    return normalizedHeat;
  };
  
  
  (function () {
    var gaussian, smoothedHeat, x, y, splitKey,
        i, j, result, heatVal;
    
    gaussian = [
      [2,  4,  5,  4, 2],
      [4,  9, 12,  9, 4],
      [5, 12, 15, 12, 5],
      [4,  9, 12,  9, 4],
      [2,  4,  5,  4, 2]
    ];
    
    /*
     * smooth out the edges with a gaussian blur
     * kernel taken from http://www.bv2.co.uk/?p=511
     * so I don't have to tool around with that right now.
     * replace with your own at your leisure.
     */
    smoothHeat = function (heat) {
      
      smoothedHeat = {};
      
      $.each(heat, function (key, value) {
        result = 0;
        splitKey = key.split(',');
        x = parseInt(splitKey[0], 10);
        y = parseInt(splitKey[1], 10);

        // assume a 5x5 gaussian kernel here
        for (i = x - 2; i <= x + 2; i += 1) {
          for (j = y - 2; j <= y + 2; j += 1) {
            heatVal = heat[i + "," + j] || 0;
            result += heatVal * gaussian[i - (x - 2)][j - (y - 2)];
          }
        }

        // multiply by reciprocal of sum of the gaussian kernel
        // or divide by sum, as we do here.
        smoothedHeat[key] = value + ((value * (result / 25)) / 159);
      });

      return smoothedHeat;
    };
  }());
  
  renderHeat = function (heat) {
    var x, y, splitKey, rgb;
    
    $.each(heat, function (key, value) {
      splitKey = key.split(',');
      x = splitKey[0];
      y = splitKey[1];
      
      rgb = hueToRGB(toHue(value), 1, 1);
      
      context.fillStyle = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
      context.fillRect(x, y, 1, 1);
    });
  };
  
  /*
   * take normalized heat value from above and 
   * convert it to a 0 (red, hot) - 240 (blue, cold) range.
   * we assume the passed normalized values are
   *  0 (cold) - 255 (hot)
   */
  toHue = function (value) {
    if (cache.toHue[value]) {
      return cache.toHue[value];
    }
    
    cache.toHue[value] = 240 - Math.floor((value * 240) / 255);
    
    return cache.toHue[value];
  };
  
  /*
   * HSV to RGB color conversion
   *
   * pulled from http://snipplr.com/view.php?codeview&id=14590
   * 
   * h: 0-360 , whole numbers
   * s: 0-1, decimals ok
   * v: 0-1, decimals ok
   */
  hueToRGB = function (h, s, v) {
    var r, g, b,
        i,
        f, p, q, t,
        cachekey = h + "/" + s + "/" + v;
    
    if (cache.hueToRGB[cachekey]) {
      return cache.hueToRGB[cachekey];
    }
    
    // Make sure our arguments stay in-range
    h = Math.max(0, Math.min(360, h));
    s = Math.max(0, Math.min(1, s));
    v = Math.max(0, Math.min(1, v));
    
    if (s === 0) {
      // Achromatic (grey)
      r = g = b = v;
      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
    
    h /= 60; // sector 0 to 5
    i = Math.floor(h);
    f = h - i; // factorial part of h
    p = v * (1 - s);
    q = v * (1 - s * f);
    t = v * (1 - s * (1 - f));
  
    switch (i) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
      
    case 1:
      r = q;
      g = v;
      b = p;
      break;
      
    case 2:
      r = p;
      g = v;
      b = t;
      break;
      
    case 3:
      r = p;
      g = q;
      b = v;
      break;
      
    case 4:
      r = t;
      g = p;
      b = v;
      break;
      
    default: // case 5:
      r = v;
      g = p;
      b = q;
    }
    
    cache.hueToRGB[cachekey] = [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    return cache.hueToRGB[cachekey];
  };
  
  setInterval(function () {
    renderHeat(normalizeHeat(smoothHeat(heat)));
    
    // run with no smoothing. faster, but ugly as hell.
//    renderHeat(normalizeHeat(heat));
  }, 500);
});
