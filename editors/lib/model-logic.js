// docs/reqs/lib/model-logic.js — Model Editor固有の純粋関数
(function(exports) {

  // エンティティ初期位置設定
  exports.ensurePositions = function(data, config) {
    if (!data || !data.entities) return data;
    var cols = config.cols, gapX = config.gapX, gapY = config.gapY;
    var padX = config.padX, padY = config.padY;
    data.entities.forEach(function(ent, i) {
      if (ent.x === undefined || ent.y === undefined) {
        ent.x = padX + (i % cols) * gapX;
        ent.y = padY + Math.floor(i / cols) * gapY;
      }
    });
    return data;
  };

  // 丸囲み数字
  var CIRCLED = ["⓪","①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩","⑪","⑫","⑬","⑭","⑮","⑯","⑰","⑱","⑲","⑳"];
  exports.CIRCLED = CIRCLED;
  exports.circled = function(n) {
    return n < CIRCLED.length ? CIRCLED[n] : String(n);
  };

})(typeof module !== 'undefined' ? module.exports : (window.__editorLib = window.__editorLib || {}));
