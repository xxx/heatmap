(function () {
  var smoothHeat, normalizeHeat, canvasWidth, canvasHeight;
  
  onmessage = function (event) {
    var data = JSON.parse(event.data), result;
    canvasWidth = data.width;
    canvasHeight = data.height;
    result = data.smoothing ? normalizeHeat(smoothHeat(data.heat)) : normalizeHeat(data.heat);
    postMessage(JSON.stringify({heat: result}));
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
     * smooth out the edges with a (pseudo) gaussian blur
     * kernel taken from http://www.bv2.co.uk/?p=511
     * so I don't have to tool around with that right now.
     * replace with your own at your leisure.
     */
    smoothHeat = function (heat) {
      smoothedHeat = {};
      
      for (x = 0; x < canvasWidth; x += 1) {
        for (y = 0; y < canvasHeight; y += 1) {
          result = 0;
          // assume a 5x5 gaussian kernel here
          for (i = x - 2; i <= x + 2; i += 1) {
            if (i < 0 || i >= canvasWidth) {
              continue;
            }
            
            for (j = y - 2; j <= y + 2; j += 1) {
              if (j < 0 || j >= canvasHeight) {
                continue;
              }
              
              heatVal = heat[i + "," + j] || 0;
              result += heatVal * gaussian[i - (x - 2)][j - (y - 2)];
            }
          }

          // multiply by reciprocal of sum of the gaussian kernel
          // or divide by sum, as we do here.
          if (result > 0) {
            result /= 159;
            smoothedHeat[x + "," + y] = result;
          }
        }
      }
      
//      $.each(heat, function (key, value) {
//        result = 0;
//        splitKey = key.split(',');
//        x = parseInt(splitKey[0], 10);
//        y = parseInt(splitKey[1], 10);
//
//        // assume a 5x5 gaussian kernel here
//        for (i = x - 2; i <= x + 2; i += 1) {
//          for (j = y - 2; j <= y + 2; j += 1) {
//            heatVal = heat[i + "," + j] || 0;
//            result += heatVal * gaussian[i - (x - 2)][j - (y - 2)];
//          }
//        }
//
//        // multiply by reciprocal of sum of the gaussian kernel
//        // or divide by sum, as we do here.
//        result /= 159;
//        smoothedHeat[key] = result;
//      });

      return smoothedHeat;
    };
  }());
  
  
  /*
   * normalize to a 0-255 range
   */
  normalizeHeat = function (heat) {
    var minHeat, maxHeat, heatValues = [], normalizedHeat = {},
        denominator, key;
    
    for (key in heat) {
      heatValues.push(heat[key]);
    }
    
    minHeat = Math.min.apply(this, heatValues);
    maxHeat = Math.max.apply(this, heatValues);
    
    denominator = maxHeat - minHeat;
    
    if (denominator === 0 || denominator === Number.NEGATIVE_INFINITY) {
      denominator = 1;
    }
    
    for (key in heat) {
      normalizedHeat[key] = Math.floor(255 * ((heat[key] - minHeat) / denominator));
    }
    
    return normalizedHeat;
  };
  
}());
