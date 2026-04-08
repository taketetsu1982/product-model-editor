// docs/reqs/lib/screen-logic.js — Screen Editor固有の純粋関数
(function(exports) {

  // スクリーン自動配置（Actor別にグリッド配置）
  exports.ensureScreenPositions = function(data, actors, config) {
    if (!data || !data.screens || !actors) return data;
    var cols = config.cols, gapX = config.gapX, gapY = config.gapY;
    var padX = config.padX, padY = config.padY;
    var minSpanFactor = config.minSpanFactor, minSpanMin = config.minSpanMin;
    actors.forEach(function(actor) {
      var actorScreens = data.screens.filter(function(s) { return s.actorId === actor.id; });
      if (actorScreens.length < 2) return;
      var xs = actorScreens.map(function(s) { return s.x; });
      var ys = actorScreens.map(function(s) { return s.y; });
      var rangeX = Math.max.apply(null, xs) - Math.min.apply(null, xs);
      var rangeY = Math.max.apply(null, ys) - Math.min.apply(null, ys);
      var minSpan = Math.max((actorScreens.length - 1) * minSpanFactor, minSpanMin);
      if (rangeX + rangeY >= minSpan) return;
      actorScreens.forEach(function(scr, i) {
        scr.x = padX + (i % cols) * gapX;
        scr.y = padY + Math.floor(i / cols) * gapY;
      });
    });
    return data;
  };

})(typeof module !== 'undefined' ? module.exports : (window.__editorLib = window.__editorLib || {}));
