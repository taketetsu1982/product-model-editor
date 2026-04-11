# 用語定義

| 用語 | 定義 |
|---|---|
| Object | ユーザーが操作する対象物。複数インスタンスを持ち、共通のアクションを適用できるもの |
| Pane | 1つのObjectを特定の形式（collection / single）で表示する最小単位。画面ではない |
| View | Paneの集合としての表示層。JSONでは `views` キーにPaneを格納する |
| Field | Objectの属性。Pane上に表示される情報項目 |
| Verb | Objectに対する操作。Pane上に配置されるアクション |
| Transition | Pane間の遷移。ユーザー操作をトリガーとする |
| Actor | ロール。アクセス可能なObjectの範囲を定義する |
| Relation | Object間の関連。親→子の一方向で定義する |
