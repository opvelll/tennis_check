# Tennis Check 設計メモ

## 1. 目的

競技者向けの練習カタログから、その日の条件に合う項目を探し、自分用セットアップへ追加する。セットアップでは実施履歴を色の濃さで一覧化し、「最近触れていない項目」を一目で分かるようにする。

このアプリ固有の要点は次の3つ。

1. **練習一覧と自分用セットアップを分離する。** カタログ更新で個人履歴を壊さない。
2. **チェックは真偽値ではなく時刻。** 最終実施時刻から連続的に色を薄くする。
3. **コート図は画像ではなくデータ。** 正規化座標から共通SVGを描き、配置・球道・移動・狙いを同じ記法で示す。

## 2. 画面

### 練習一覧

- 全項目を検索・絞り込みする。
- 項目カードで目的、条件、チェックポイント、動画、コート図を確認する。
- 任意の項目を自分用の標準セットアップへ追加する。
- カタログ自体にはチェック状態を持たせない。

### 自分用セットアップ

- 選択した全項目を小さなタイルで一覧表示する。
- タイルを押すと実施時刻を記録し、カテゴリ色を最大濃度に戻す。
- 時間経過に応じて色が薄くなる。
- カテゴリ、タグ、期限切れ、実施可能条件で絞り込む。
- 初期版はシングルス中心の標準セット1つとし、複数セットは将来の状態移行で追加する。

### 項目詳細

- 目的、セットアップ、手順、チェックポイント、成功条件、失敗例、負荷・注意点を表示する。
- 動画は「見る位置」と「何を見るか」を併記する。
- コート図はフェーズを切り替えられる。

## 3. 技術構成

- React + TypeScript + Vite
- Zustand `persist` middleware + `localStorage`
- GitHub Pages + GitHub Actions
- ルーティングはPages上の404問題を避けるため、初期版はHash Routerまたは単一画面にする。
- カタログはリポジトリ内の静的JSON。個人状態だけをZustandで永続化する。
- 書き出し・同期・ログイン機能は初期スコープ外。

## 4. データの境界

### カタログ（Git管理・読み取り専用）

```ts
type Drill = {
  id: string;                    // 一度公開したら変更しない
  name: string;
  aliases: string[];
  category: [string, string, string?];
  summary: string;
  purposes: string[];
  formats: string[];             // 手出し、球出し、ラリー、ポイント等
  disciplines: ("singles" | "doubles" | "both")[];
  environments: string[];
  playerCount: { min: number; max?: number };
  equipment: string[];
  intensity: "low" | "medium" | "high";
  durationMinutes: { min: number; max: number };
  tags: string[];
  setup: string[];
  steps: string[];
  cues: string[];
  successCriteria: string[];
  commonErrors: string[];
  safetyNotes: string[];
  progressions: string[];
  regressions: string[];
  diagram?: CourtDiagram;
  media: MediaReference[];
  sources: string[];             // data/sources.json のID
  status: "researched" | "draft";
};
```

### 個人状態（Zustand・localStorage）

```ts
type PersonalState = {
  schemaVersion: number;
  settings: {
    defaultFadeDays: number;      // 初期値 3
    fadeMultiplier: number;      // 初期値 1。全項目に適用
  };
  setup: {
    id: "singles-default";
    name: string;
    drillIds: string[];
  };
  records: Record<string, {
    lastCompletedAt?: string;   // ISO 8601
    completedCount: number;
    fadeDaysOverride?: number;  // 未設定なら全体デフォルト
    personalNote?: string;
  }>;
};
```

カタログに存在しない古いIDが個人状態に残っても、読み込みを失敗させず「利用不可項目」として除外表示する。

## 5. 退色ルール

個別設定は「倍率適用前の基準日数」とする。したがって、全体倍率はすべての項目に効く。

```ts
const baseDays = item.fadeDaysOverride ?? settings.defaultFadeDays;
const effectiveDays = baseDays * settings.fadeMultiplier;
const progress = clamp(1 - elapsedMs / daysToMs(effectiveDays), 0, 1);
```

- `progress = 1`: 実施直後、カテゴリ色100%
- `progress = 0.5`: 半分経過、カテゴリ色50%相当
- `progress = 0`: 期限到達、無彩色
- 色は60秒ごと、および画面復帰時に再計算する。時間そのものは保存しない。
- `prefers-reduced-motion`ではアニメーションせず、色だけ更新する。

推奨回復期間と退色期間は別概念にする。色を埋めるための高負荷練習を誘発しないよう、フィジカル項目には負荷・注意点を表示する。

## 6. タグと検索

分類は1本の階層、タグは横断検索に使う。人数・時間・強度・環境・用具はタグではなく構造化フィールドにする。

初期フィルター：

- シングルス／ダブルス／共通
- カテゴリ、目的、練習形式
- 人数、環境、用具
- 強度、所要時間
- ボール条件、局面、身体部位

自由タグの追加画面は設けず、カタログ側の統制語彙を使う。

## 7. コートSVG

座標は左上を `(0, 0)`、右下を `(100, 100)` とする。コート線は共通コンポーネントで描き、項目ごとの差分だけ保存する。

```ts
type CourtDiagram = {
  orientation: "vertical";
  phases: {
    label: string;
    actors: { id: string; role: string; x: number; y: number }[];
    equipment: { type: string; x: number; y: number; label?: string }[];
    paths: {
      type: "ball" | "movement";
      points: [number, number][];
      order?: number;
    }[];
    targets: {
      shape: "rect" | "ellipse" | "polygon";
      points: [number, number][];
      label?: string;
    }[];
  }[];
};
```

表示記号は固定する：選手=青、相手・球出し役=赤、ボール軌道=実線、移動=点線、狙い=黄色半透明、用具=黒、順序=丸数字。

## 8. 永続化と更新

- localStorageキー：`tennis-check:personal:v1`
- Zustandの`version`と`migrate`を必ず設定する。
- `partialize`でUIの一時状態、検索語、カタログを保存対象から除く。
- カタログ更新時は安定IDで突合する。
- ブラウザ・端末間同期、バックアップ、書き出しは行わない。

## 9. 初期完成条件

- 約100項目の競技者向けカタログを読み込める。
- 条件検索とセットアップ追加ができる。
- 全体・個別の退色期間が期待どおり合成される。
- 再読み込み後も実施時刻とセットアップが残る。
- コート図を持つ項目は、同じSVG記法で表示される。
- GitHub Pagesのサブパスで直接利用できる。
