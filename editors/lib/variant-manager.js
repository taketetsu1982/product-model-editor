// editors/lib/variant-manager.js — バリアントモード管理の純粋関数
(function(exports) {

  // モデルキー（バリアントに格納するキー）
  var MODEL_KEYS = ['objects', 'views', 'paneGraph', 'screens'];

  // バリアントIDとラベルの生成用（a→Option A, b→Option B, ...）
  var VARIANT_IDS   = 'abcdefghijklmnopqrstuvwxyz'.split('');
  var VARIANT_NAMES = VARIANT_IDS.map(function(id) {
    return 'Option ' + id.toUpperCase();
  });

  /**
   * バリアントモードかどうか判定する
   * @param {Object} data - モデルデータ
   * @returns {boolean}
   */
  exports.isVariantMode = function isVariantMode(data) {
    return Array.isArray(data._variants) && data._variants.length > 0;
  };

  /**
   * 通常モード→バリアントモードへ変換、またはバリアントを追加する
   * @param {Object} data - モデルデータ
   * @returns {Object} 新しいモデルデータ（元データを変更しない）
   */
  exports.toVariantMode = function toVariantMode(data) {
    if (!exports.isVariantMode(data)) {
      // 通常モード → バリアントモードに変換
      var modelData = {};
      MODEL_KEYS.forEach(function(key) {
        if (data[key] !== undefined) {
          modelData[key] = data[key];
        }
      });

      var variantA = Object.assign(
        { id: 'a', name: 'Option A', active: true },
        JSON.parse(JSON.stringify(modelData))
      );
      var variantB = Object.assign(
        { id: 'b', name: 'Option B', active: false },
        JSON.parse(JSON.stringify(modelData))
      );

      // パススルーキーを収集（モデルキー・_variants以外）
      var result = {};
      Object.keys(data).forEach(function(key) {
        if (MODEL_KEYS.indexOf(key) === -1 && key !== '_variants') {
          result[key] = data[key];
        }
      });
      result._variants = [variantA, variantB];
      return result;
    } else {
      // バリアントモード → アクティブバリアントをコピーして追加
      var activeVariant = exports.getActiveVariant(data);
      var nextIndex = data._variants.length;
      var nextId   = VARIANT_IDS[nextIndex]   || String(nextIndex);
      var nextName = VARIANT_NAMES[nextIndex] || ('Option ' + nextIndex);

      // アクティブバリアントからモデルキーのみを抽出してコピー
      var copyData = {};
      MODEL_KEYS.forEach(function(key) {
        if (activeVariant[key] !== undefined) {
          copyData[key] = activeVariant[key];
        }
      });

      var newVariant = Object.assign(
        { id: nextId, name: nextName, active: false },
        JSON.parse(JSON.stringify(copyData))
      );

      var result = {};
      Object.keys(data).forEach(function(key) {
        if (key !== '_variants') {
          result[key] = data[key];
        }
      });
      result._variants = data._variants.concat([newVariant]);
      return result;
    }
  };

  /**
   * アクティブなバリアントを返す
   * active: true のバリアントがなければ最初のバリアントをフォールバックとして返す
   * @param {Object} data - バリアントモードのモデルデータ
   * @returns {Object} バリアントオブジェクト
   */
  exports.getActiveVariant = function getActiveVariant(data) {
    var active = data._variants.find(function(v) { return v.active === true; });
    return active || data._variants[0];
  };

  /**
   * 指定したバリアントをアクティブにする（イミュータブル）
   * @param {Object} data - バリアントモードのモデルデータ
   * @param {string} variantId - アクティブにするバリアントのID
   * @returns {Object} 新しいモデルデータ
   */
  exports.switchVariant = function switchVariant(data, variantId) {
    var newVariants = data._variants.map(function(v) {
      return Object.assign({}, v, { active: v.id === variantId });
    });
    return Object.assign({}, data, { _variants: newVariants });
  };

})(typeof module !== 'undefined' ? module.exports : (window.__variantManager = window.__variantManager || {}));
