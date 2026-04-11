// editors/lib/view-logic.js — View Editor固有の純粋関数
(function(exports) {

  var SORT_LAST = Infinity;
  var TYPE_ORDER_OTHER = 2;
  // Paneの高さ計算に使う定数
  var HEADER_H = 36;
  var ROW_H = 22;

  // Paneの高さを計算（fields + verbsの数に基づく）
  function calcPaneHeight(vw) {
    var fields = (vw.fields || []).length;
    var verbs = (vw.verbs || []).length;
    var hasContent = fields > 0 || verbs > 0;
    return HEADER_H + (hasContent ? 8 : 40) + fields * ROW_H + (verbs > 0 ? verbs * ROW_H + 8 : 0) + 8;
  }

  // objectsのリレーション階層深さを計算（BFS）
  function computeObjectDepths(objects) {
    var childIds = {};
    objects.forEach(function(obj) {
      (obj.relations || []).forEach(function(rel) {
        if (rel.targetId && rel.targetId !== obj.id) {
          childIds[rel.targetId] = true;
        }
      });
    });
    var roots = objects.filter(function(obj) { return !childIds[obj.id]; });
    // 循環グラフ等でルートが見つからない場合、先頭要素をフォールバック
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
    return depth;
  }

  // Paneをobjectの階層深さ順にグルーピング
  function groupPanesByObject(views, objects, depth) {
    var groups = {};
    var allOids = [];
    views.forEach(function(vw) {
      var oid = vw.objectId || "__none";
      if (!groups[oid]) {
        groups[oid] = [];
        allOids.push(oid);
      }
      groups[oid].push(vw);
    });

    // 各グループ内でcollection → single → その他の順にソート
    var typeOrder = { collection: 0, single: 1 };
    allOids.forEach(function(oid) {
      groups[oid].sort(function(a, b) {
        var oa = typeOrder[a.type] !== undefined ? typeOrder[a.type] : TYPE_ORDER_OTHER;
        var ob = typeOrder[b.type] !== undefined ? typeOrder[b.type] : TYPE_ORDER_OTHER;
        return oa - ob;
      });
    });

    // objectIdを階層深さ順 → objects配列の出現順でソート
    var objIndex = {};
    objects.forEach(function(obj, i) { objIndex[obj.id] = i; });
    allOids.sort(function(a, b) {
      var da = depth[a] !== undefined ? depth[a] : SORT_LAST;
      var db = depth[b] !== undefined ? depth[b] : SORT_LAST;
      if (da !== db) return da - db;
      var ia = objIndex[a] !== undefined ? objIndex[a] : SORT_LAST;
      var ib = objIndex[b] !== undefined ? objIndex[b] : SORT_LAST;
      return ia - ib;
    });

    return { groups: groups, sortedOids: allOids };
  }

  // Pane自動配置（階層行 × collection+single横並び + 可変高さ対応）
  exports.ensureViewPositions = function(data, config) {
    if (!data || !data.views) return data;
    var views = data.views;
    if (views.length < 2) return data;

    var gapX = config.gapX, gapY = config.gapY;
    var padX = config.padX, padY = config.padY;
    var paneW = config.paneW || 240;

    // 座標未設定のPaneがあるか判定
    var needsLayout = views.some(function(vw) {
      return vw.x === undefined || vw.y === undefined;
    });
    if (!needsLayout) {
      var xs = views.map(function(s) { return s.x; });
      var ys = views.map(function(s) { return s.y; });
      var rangeX = Math.max.apply(null, xs) - Math.min.apply(null, xs);
      var rangeY = Math.max.apply(null, ys) - Math.min.apply(null, ys);
      var minSpan = Math.max((views.length - 1) * config.minSpanFactor, config.minSpanMin);
      if (rangeX + rangeY >= minSpan) return data;
    }

    var objects = data.objects || [];
    var depth = computeObjectDepths(objects);
    var result = groupPanesByObject(views, objects, depth);

    // 階層深さごとにobjectIdをグルーピング
    var depthRows = {};
    result.sortedOids.forEach(function(oid) {
      var d = depth[oid] !== undefined ? depth[oid] : 0;
      if (!depthRows[d]) depthRows[d] = [];
      depthRows[d].push(oid);
    });
    var depthKeys = Object.keys(depthRows).map(Number).sort(function(a, b) { return a - b; });

    // collection+singleの横並び幅（Pane幅 + Pane間の小ギャップ）
    var pairGap = Math.round(gapX * 0.3);

    // 行ごとに配置
    var currentY = padY;
    depthKeys.forEach(function(d) {
      var oids = depthRows[d];
      var currentX = padX;
      var rowMaxH = 0;

      oids.forEach(function(oid, oidIdx) {
        var panes = result.groups[oid];
        // メイン: 最初のcollection + 最初のsingle（横並び）
        // サブ: 残り（メインの下に縦積み）
        var mainPanes = [];
        var subPanes = [];
        var hasCollection = false, hasSingle = false;
        panes.forEach(function(vw) {
          if (vw.type === 'collection' && !hasCollection) {
            hasCollection = true;
            mainPanes.push(vw);
          } else if (vw.type === 'single' && !hasSingle) {
            hasSingle = true;
            mainPanes.push(vw);
          } else {
            subPanes.push(vw);
          }
        });

        // メインPaneを横並びに配置
        var groupStartX = currentX;
        var mainMaxH = 0;
        mainPanes.forEach(function(vw, i) {
          vw.x = groupStartX + i * (paneW + pairGap);
          vw.y = currentY;
          var h = calcPaneHeight(vw);
          if (h > mainMaxH) mainMaxH = h;
        });

        // メインの横幅を計算
        var mainWidth = mainPanes.length > 0
          ? mainPanes.length * paneW + (mainPanes.length - 1) * pairGap
          : paneW;

        // サブPaneをメインの下に縦積み
        var subY = currentY + mainMaxH + gapY;
        var totalH = mainMaxH;
        subPanes.forEach(function(vw) {
          vw.x = groupStartX;
          vw.y = subY;
          var h = calcPaneHeight(vw);
          subY += h + gapY;
          totalH = subY - currentY - gapY;
        });

        if (totalH > rowMaxH) rowMaxH = totalH;

        // 次のobjectグループのX位置
        currentX += mainWidth + gapX;
      });

      // 次の行のY位置（この行の最大高さ + ギャップ）
      currentY += rowMaxH + gapY;
    });

    return data;
  };

  // テスト用にエクスポート
  exports._calcPaneHeight = calcPaneHeight;

})(typeof module !== 'undefined' ? module.exports : (window.__editorLib = window.__editorLib || {}));
