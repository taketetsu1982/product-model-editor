// editors/lib/view-logic.js — View Editor固有の純粋関数
(function(exports) {

  // Pane自動配置（オブジェクトグループ × 階層順）
  // objectsのリレーション階層順に列を決め、同じobjectIdのPaneを縦に並べる
  exports.ensureViewPositions = function(data, config) {
    if (!data || !data.views) return data;
    var views = data.views;
    if (views.length < 2) return data;

    var gapX = config.gapX, gapY = config.gapY;
    var padX = config.padX, padY = config.padY;

    // 座標未設定のPaneがあるか判定
    var needsLayout = views.some(function(vw) {
      return vw.x === undefined || vw.y === undefined;
    });
    if (!needsLayout) {
      // 既存の密集判定: すべて座標設定済みでも密集していたら再配置
      var xs = views.map(function(s) { return s.x; });
      var ys = views.map(function(s) { return s.y; });
      var rangeX = Math.max.apply(null, xs) - Math.min.apply(null, xs);
      var rangeY = Math.max.apply(null, ys) - Math.min.apply(null, ys);
      var minSpanFactor = config.minSpanFactor, minSpanMin = config.minSpanMin;
      var minSpan = Math.max((views.length - 1) * minSpanFactor, minSpanMin);
      if (rangeX + rangeY >= minSpan) return data;
    }

    var objects = data.objects || [];

    // objectsのリレーション階層順を計算（BFS）
    var childIds = {};
    objects.forEach(function(obj) {
      (obj.relations || []).forEach(function(rel) {
        if (rel.targetId && rel.targetId !== obj.id) {
          childIds[rel.targetId] = true;
        }
      });
    });
    var roots = objects.filter(function(obj) { return !childIds[obj.id]; });
    if (roots.length === 0 && objects.length > 0) roots = [objects[0]];

    var depth = {};
    var visited = {};
    var queue = [];
    roots.forEach(function(r) { depth[r.id] = 0; visited[r.id] = true; queue.push(r.id); });

    var idMap = {};
    objects.forEach(function(obj) { idMap[obj.id] = obj; });

    while (queue.length > 0) {
      var current = queue.shift();
      var obj = idMap[current];
      if (!obj) continue;
      (obj.relations || []).forEach(function(rel) {
        if (rel.targetId && !visited[rel.targetId] && idMap[rel.targetId]) {
          depth[rel.targetId] = depth[current] + 1;
          visited[rel.targetId] = true;
          queue.push(rel.targetId);
        }
      });
    }
    objects.forEach(function(obj) {
      if (depth[obj.id] === undefined) depth[obj.id] = 0;
    });

    // objectIdでPaneをグルーピング
    var groups = {};
    var groupOrder = [];
    views.forEach(function(vw) {
      var oid = vw.objectId || "__none";
      if (!groups[oid]) {
        groups[oid] = [];
        groupOrder.push(oid);
      }
      groups[oid].push(vw);
    });

    // グループをobjectの階層深さ順でソート（同じ深さはobjects配列の出現順）
    var objIndex = {};
    objects.forEach(function(obj, i) { objIndex[obj.id] = i; });
    groupOrder.sort(function(a, b) {
      var da = depth[a] !== undefined ? depth[a] : 999;
      var db = depth[b] !== undefined ? depth[b] : 999;
      if (da !== db) return da - db;
      var ia = objIndex[a] !== undefined ? objIndex[a] : 999;
      var ib = objIndex[b] !== undefined ? objIndex[b] : 999;
      return ia - ib;
    });

    // 各グループ内でcollection → single → その他の順にソート
    var typeOrder = { collection: 0, single: 1 };
    groupOrder.forEach(function(oid) {
      groups[oid].sort(function(a, b) {
        var oa = typeOrder[a.type] !== undefined ? typeOrder[a.type] : 2;
        var ob = typeOrder[b.type] !== undefined ? typeOrder[b.type] : 2;
        return oa - ob;
      });
    });

    // 列ごとに配置
    groupOrder.forEach(function(oid, col) {
      var panes = groups[oid];
      panes.forEach(function(vw, row) {
        vw.x = padX + col * gapX;
        vw.y = padY + row * gapY;
      });
    });

    return data;
  };

})(typeof module !== 'undefined' ? module.exports : (window.__editorLib = window.__editorLib || {}));
