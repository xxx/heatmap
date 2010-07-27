(function () {
  var normalizeHeat;
  
  onmessage = function (event) {
    var data = JSON.parse(event.data), result;
    result = normalizeHeat(data.heat);
    postMessage(JSON.stringify({heat: result}));
  };

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
