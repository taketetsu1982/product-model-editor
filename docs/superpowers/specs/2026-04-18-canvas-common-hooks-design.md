# Canvas共通操作の抽出 設計書

## 概要

ObjectView / MapView / ScreenView で重複実装されているキャンバス操作（zoom, pan, wheel, Escape, viewState保存, ズームボタン）を、`useCanvas` カスタムフックと `ZoomControls` コンポーネントに抽出する。

## 対象の重複操作

| 機能 | Object | Pane | Screen | 重複度 |
|------|--------|------|--------|--------|
| ズーム（Ctrl+Wheel） | ✓ | ✓ | ✓ | 100% |
| ホイールスクロール | ✓ | ✓ | ✓ | 100% |
| ズームボタン（+/-/reset） | ✓ | ✓ | ✓ | 100% |
| パン（背景ドラッグ） | ✓ | ✓ | ✓ | 85% |
| Escapeキー | ✓ | ✓ | ✗ | 100%(O/P間) |
| savedViewState保存/復元 | ✓ | ✓ | ✗ | 100%(O/P間) |

## useCanvas フック

### インタフェース

```js
const {
  svgRef,           // SVGキャンバスのref
  zoom, setZoom,    // ズーム状態
  pan, setPan,      // パン状態
  panning,          // パン中フラグ（カーソル変更用）
  onWheel,          // SVGに渡すwheelハンドラ
  onBgMouseDown,    // SVG背景のmousedownハンドラ（パン開始）
  onMouseMove,      // mousemove内でパン処理を呼ぶ関数（パン中ならtrue返却）
  onMouseUpOrLeave, // mouseup/mouseleave内でパン終了を呼ぶ関数
} = useCanvas({
  items,            // 初期パン位置計算用のアイテム配列
  itemW, itemH,     // アイテムのサイズ
  savedViewState,   // タブ切替時の復元用（null可）
  onViewStateChange,// アンマウント時の保存用（null可）
  onEscape,         // Escape時のコールバック（View固有の選択解除処理）
});
```

### 内包する既存機能

- `useInitialPan` の呼び出し（items, itemW, itemHを渡す）
- `zoom` / `setZoom` の state（初期値は `savedViewState?.zoom || 1`）
- `panning` / `setPanning` の state
- `panStart` ref
- `zoomRef` / `panRef`（アンマウント時の保存用）
- `onWheel` — Ctrl+Wheelでズーム、通常Wheelでパン
- `onBgMouseDown` — パン開始（`panStart.current` に現在位置を保存）
- `onMouseMove` — パン中なら `setPan` を更新。パン中かどうかを返す（`true`=パン処理済み、呼び出し元はドラッグ処理をスキップ）
- `onMouseUpOrLeave` — `setPanning(false)` でパン終了
- Escape keydown リスナー — `onEscape` コールバックを呼ぶ
- `savedViewState` からの復元（mount時）
- `onViewStateChange` への保存（unmount時）

### onMouseMoveの返り値

各Viewの `onMM` ハンドラ内で以下のように使う:

```js
const onMM = e => {
  if (canvas.onMouseMove(e)) return; // パン処理済みならスキップ
  // View固有のドラッグ処理
};
```

## ZoomControls コンポーネント

### インタフェース

```jsx
<ZoomControls svgRef={svgRef} zoom={zoom} setZoom={setZoom} pan={pan} setPan={setPan} />
```

### 内容

- − ボタン: 0.8倍（最小 ZOOM_MIN）、キャンバス中心基準
- + ボタン: 1.25倍（最大 ZOOM_MAX）、キャンバス中心基準
- %表示クリック: 100%にリセット、キャンバス中心基準
- スタイル: `position:absolute, bottom:16, right:16`、白背景、pill型、elevation-1

## 各Viewの変更

### ObjectView

- `useInitialPan` + zoom/pan state + panStart + panning + onWheel + Escape useEffect + savedViewState復元/保存 → 削除、`useCanvas` に置き換え
- `onMM` 内のパン処理 → `canvas.onMouseMove(e)` を先頭で呼ぶ
- `onMU` / `onMouseLeave` 内のパン終了 → `canvas.onMouseUpOrLeave()` を呼ぶ
- ズームボタン群 → `<ZoomControls />` に置き換え
- `onEscape`: `() => { setMultiSel(new Set()); multiOffsets.current = {}; setConnDrag(null); }`

### MapView

- ObjectViewと同じパターンで置き換え
- `onEscape`: `() => { setMultiSel(new Set()); multiOffsets.current = {}; setConnDrag(null); }`

### ScreenView

- ObjectView/MapViewと同じパターンで置き換え
- 新規: `savedViewState` / `onViewStateChange` propsを受け取る
- 新規: `onEscape`: `() => { setSelId(null); }`
- App側の `tabViewState.current` に `screen: { zoom: null, pan: null }` を追加
- App側の ScreenView 呼び出しに `savedViewState` / `onViewStateChange` を追加

### 背景クリック（選択解除）

各Viewに残す。View固有の選択状態リセットが異なるため。共通判定 `e.target===e.currentTarget || e.target.getAttribute('data-bg')` は各Viewで維持。

## 配置先

- `useCanvas` → `editors/lib/ui-components.js`（既存の `useHistory` と同じファイル）
- `ZoomControls` → `editors/lib/ui-components.js`（既存の `VariantBar` と同じファイル）
