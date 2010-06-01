$(function () {
  var heat = {},
      canvas = $('#overlay'),
      canvasWidth,
      canvasHeight,
      context = canvas.get(0).getContext('2d'),
      cache = { toHue: {}, hueToRGB: {} },
      renderHeat,
      dumpHeat,
      toHue,
      hueToRGB,
      mousemoveMask,
      clickMask,
      applyMask,
      worker,
      renderStartTime;
  
  worker = new Worker('render_worker.js');
  worker.onmessage = function (event) {
    renderHeat(JSON.parse(event.data).heat);
    $('#render-time .time').text((new Date().getTime() - renderStartTime) / 1000);
    renderStartTime = 0;
    $('button').removeAttr('disabled');
  };
  
  // mask we apply to a point that is moused over.
  mousemoveMask = [
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
    width: $('#trackme').width(),
    height: $('#trackme').height()
  });
  
  canvasWidth = canvas.attr('width');
  canvasHeight = canvas.attr('height');

  applyMask = function (mask, eventX, eventY) {
    var key, i, j, initialI, initialJ, maskSeg;

    // mask segment size: truncation of length / 2; length should be odd
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
  
  $('#trackme:not(.disabled)').click(function (event) {
    var offset = $(this).offsetParent().offset();
    applyMask(clickMask, event.pageX - offset.left, event.pageY - offset.top);
  }).mousemove(function (event) {
    var offset = $(this).offsetParent().offset();
    applyMask(mousemoveMask, event.pageX - offset.left, event.pageY - offset.top);
  });
  
  renderHeat = function (heat) {
    var x, y, splitKey, rgb;
    
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    $.each(heat, function (key, value) {
      splitKey = key.split(',');
      x = splitKey[0];
      y = splitKey[1];
      
      rgb = hueToRGB(toHue(value), 1, 1);
      
      context.fillStyle = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
      context.fillRect(x, y, 1, 1);
    });

    $('#overlay').fadeIn('fast');
  };

  dumpHeat = function (heat) {
    var val = '{\n';

    $.each(heat, function (k, v) {
      if (v !== 0) {
        val += '  "' + k + '": ' + v + ",\n";
      }
    });

    // strip off last comma so we are json-compliant
    if (!$.isEmptyObject(heat)) {
      val = val.substring(0, val.length - 2);
    }

    val += "\n}\n"
    $('#data-output').text(val);
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
  
  $('.render-button').click(function (e) {
    $('button').attr('disabled', true);
    $('#trackme').addClass('disabled');
    renderStartTime = new Date().getTime();
    worker.postMessage(JSON.stringify({heat: heat, width: canvasWidth, height: canvasHeight, smoothing: this.id === 'do-render'}));
  });

  $('#clear-data').click(function (e) {
    heat = {};
    context.clearRect(0, 0, canvasWidth, canvasHeight);
  });

  $('#collect-data').click(function (e) {
    $(this).attr('disabled', true);
    $('#trackme').removeClass('disabled');
    $('#overlay').fadeOut('fast');
  });

  $('#dump-data').click(function (e) {
    dumpHeat(heat);
  });

  $('#import-data').click(function (e) {
    try {
      heat = JSON.parse($('#data-output').val());
    }
    catch (err) {}
  });
});
