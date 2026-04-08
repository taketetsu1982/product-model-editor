// editors/lib/view-logic.js — View Editor固有の純粋関数
(function(exports) {

  // ビュー自動配置（密集しているビューをグリッド再配置）
  exports.ensureViewPositions = function(data, config) {
    if (!data || !data.views) return data;
    var cols = config.cols, gapX = config.gapX, gapY = config.gapY;
    var padX = config.padX, padY = config.padY;
    var minSpanFactor = config.minSpanFactor, minSpanMin = config.minSpanMin;
    var views = data.views;
    if (views.length < 2) return data;
    var xs = views.map(function(s) { return s.x; });
    var ys = views.map(function(s) { return s.y; });
    var rangeX = Math.max.apply(null, xs) - Math.min.apply(null, xs);
    var rangeY = Math.max.apply(null, ys) - Math.min.apply(null, ys);
    var minSpan = Math.max((views.length - 1) * minSpanFactor, minSpanMin);
    if (rangeX + rangeY >= minSpan) return data;
    views.forEach(function(vw, i) {
      vw.x = padX + (i % cols) * gapX;
      vw.y = padY + Math.floor(i / cols) * gapY;
    });
    return data;
  };

})(typeof module !== 'undefined' ? module.exports : (window.__editorLib = window.__editorLib || {}));
