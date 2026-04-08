---
name: conceptual-model
description: Generate and edit conceptual model JSON with HTML editor
---

# /conceptual-model

Conceptual ModelのJSONを生成し、ブラウザで操作できるHTMLエディタを起動する。
entities / actors を編集する（screens / transitions は /screens で編集する）。

## Input

PRD・MRDの内容、またはユーザーの説明からエンティティを抽出してJSONを生成する。

## Output

- `{EDITOR_DIR}/product-model.json` — 統合JSON（HTMLで編集・保存）
- `{EDITOR_DIR}/model-editor.html` — HTMLエディタ（ブラウザで開く）

> **注:** `{EDITOR_DIR}` はプロジェクトごとに異なる。導入時に実際のパスに置換すること。

## JSON Schema（統合）

CMエディタとScreensエディタが同じJSONファイルを共有する。
各エディタは自分の担当フィールドのみ編集し、それ以外はパススルーで保持する。

```json
{
  "entities": [],
  "actors": [],
  "screens": [],
  "transitions": []
}
```

| フィールド | 編集するエディタ | 説明 |
|---|---|---|
| entities | CM | エンティティ定義 |
| actors | CM | ロール（操作者）定義 |
| screens | Screens | 画面定義（type: "screen" / "composite"） |
| transitions | Screens | 画面遷移定義 |

### entities

```json
{
  "id": "kebab-case識別子",
  "name": "表示名",
  "relations": [
    { "id": "一意ID", "targetId": "対象エンティティid", "type": "has-many | has-one | many-to-many", "label": "関係の短い説明" }
  ]
}
```

### actors

```json
{
  "id": "kebab-case識別子",
  "name": "ロール名",
  "touches": [
    {
      "entityId": "エンティティid",
      "crud": [
        { "op": "C", "scope": "all" },
        { "op": "R", "scope": "all" },
        { "op": "U", "scope": "own" },
        { "op": "D", "scope": "own" }
      ]
    }
  ]
}
```

### screens（Screensエディタの担当。スキーマ詳細は /screens の SKILL.md を参照）

```json
{
  "id": "kebab-case識別子",
  "name": "画面名",
  "actorId": "アクターid",
  "x": 60, "y": 60,
  "prompt": "実装補足指示",
  "objects": [
    { "id": "一意ID", "entityId": "エンティティid", "variant": "collection | single", "crud": ["C", "R"] }
  ]
}
```

### transitions（Screensエディタの担当）

```json
{ "id": "一意ID", "from": "screen id", "to": "screen id", "trigger": "遷移トリガー" }
```

### スキーマルール

- エンティティはフラットな配列。グルーピングはしない
- relationsの `type` は `has-many` / `has-one` / `many-to-many`
- actorsはPRDのロール定義から導出する
- **パススルールール**: CMエディタはscreens/transitionsフィールドを読み込み時に保持し、保存時にそのまま書き戻す。screens/transitionsが存在しなくてもエラーにしない

## Execution Steps

### Step 1: JSONを生成

PRD・MRD・conceptual-model等の入力ドキュメントを読み、
entities・actorsをJSONとして生成する。
既存の product-model.json がある場合はそれを読み込み、screens/transitionsはそのまま保持する。

### Step 2: JSONファイルを書き出す

`{EDITOR_DIR}/product-model.json` にJSONを書き出す。

### Step 3: ブラウザで開く

```bash
open {EDITOR_DIR}/model-editor.html
```

### Step 4: ブラウザで編集

```
Conceptual Model generated:
- JSON: {EDITOR_DIR}/product-model.json
- Editor: {EDITOR_DIR}/model-editor.html (opened in browser)

HTMLエディタで product-model.json をドラッグ&ドロップ、
または「Connect」ボタンから読み込んでください。

1. Entity タブでエンティティ・関係を確認・編集
2. Actor タブでロール別CRUD権限を確認・編集
3. 編集が完了したら教えてください
4. 確定後、/screens を実行して画面定義を作成
```

### Step 5: 変更確認（エディタ保存後）

ユーザーがエディタで編集・保存した後、`product-model.json` を読み込んで変更内容を確認する。

> **プロジェクト拡張ポイント**: ここで conceptual-model.md への同期や Specs 影響チェックなど、
> プロジェクト固有の後処理を追加できる。
