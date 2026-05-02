# 中丸晴留哉 ポートフォリオサイト — Claude Code 作業ガイド

## このプロジェクトについて

中丸晴留哉（はれるや）のポートフォリオサイト。
GitHub Pages で静的HTMLとして公開している。

**サイトURL:** https://hareruyanakamaru.github.io/  
**リポジトリ:** https://github.com/hareruyanakamaru/hareruyanakamaru.github.io  
**独自ドメイン（取得後に更新）:** https://xxxxxxxx.com  
**microCMS管理画面:** https://hareruya-portfolio.microcms.io/

---

## microCMS運用メモ

- **API:** `posts` （リスト形式）
- **フィールド:** title / category（Works|Blog 単一選択）/ tags（複数選択）/ cover（画像）/ content（リッチエディタ）
- **連携箇所:** index.html の `<script>` 内 `loadBlogPosts()` で Blogカテゴリのみ表示
- **記事の追加:** microCMS管理画面 → 「+ 追加」→ 入力 → 「公開」ボタン → サイトに自動反映（コードpush不要！）
- **APIキー:** GET（読み取り）専用。ソースに埋め込み済み

---

## ファイル構成

```
/
├── index.html        # メインページ（全セクション含む）
├── CLAUDE.md         # このファイル
└── （今後追加予定）
    ├── works/        # 制作実績の個別ページ
    ├── images/       # 写真・画像素材
    └── CNAME         # 独自ドメイン設定ファイル
```

---

## サイトの構成セクション

| セクション | 内容 |
|-----------|------|
| Hero | キャッチコピー・自己紹介ひとこと |
| 01 About | プロフィール・経歴 |
| 02 Projects | itoito・いとあわせ・空間制作など |
| 03 Blog/Note | note記事へのリンク一覧 |
| 04 Events | イベント履歴・告知 |
| 05 Contact | 問い合わせ導線 |

---

## デザインルール（変更しないこと）

- **フォント:** Shippori Mincho（本文・見出し）+ DM Mono（英字・ラベル）
- **カラー:**
  - `--paper: #f4f1e8`（背景）
  - `--ink: #1c1a16`（テキスト）
  - `--orange: #c8651a`（アクセント①）
  - `--green: #3d6b38`（アクセント②）
  - `--muted: #7a7568`（補足テキスト）
- **雰囲気:** 和紙×モノスペース。落ち着いた職人感。派手にしない。
- **アニメーション:** スクロール時のフェードアップのみ。余計なアニメは追加しない。

---

## よく使う作業パターン

### ブログ記事を1件追加する
`index.html` の `<!-- BLOG -->` セクション内、`.blog-list` の中に以下を追加：
```html
<div class="blog-item">
  <span class="blog-d">YYYY.MM</span>
  <span class="blog-title">記事タイトル</span>
  <span class="blog-cat">カテゴリ</span>
</div>
```

### イベントを1件追加する
`index.html` の `<!-- EVENTS -->` セクション内、`.events-grid` の中に追加：
```html
<div class="ev-card">
  <div class="ev-date">YYYY.MM ／ 場所</div>
  <div class="ev-title">イベント名</div>
  <div class="ev-status upcoming">UPCOMING</div>  <!-- upcoming / scheduled / done -->
</div>
```

### プロジェクトカードを追加する
`<!-- PROJECTS -->` セクション内、`.proj-grid` の中に追加：
```html
<div class="proj-card">
  <div class="proj-num">0X</div>
  <div class="proj-badge">カテゴリ — 状態</div>
  <div class="proj-title">プロジェクト名</div>
  <div class="proj-desc">説明文</div>
</div>
```

---

## 依頼するときの書き方

```
# 追加・更新
「〇〇セクションに、△△を追加して」
「イベントに『◻◻』2025年6月、江東区を追加して」
「ブログに記事タイトル『□□』2025.04を追加して」

# デザイン変更
「Contactボタンの色をorangeに変えて」
「Heroのキャッチコピーを〇〇に変更して」

# 新規ページ
「worksページを新しく作って。index.htmlと同じデザインで」
```

---

## GitHubへのデプロイ

```bash
git add .
git commit -m "変更内容のメモ"
git push origin main
```

pushすると数分でサイトに反映される。

---

## はれるやについて（コンテキスト）

- 本名：中丸晴留哉
- 拠点：東京都江東区
- 前職：公立中学校 数学教師
- 現在：フリーランス（空間デザイン・イベント制作・探究学習）
- プロジェクト：絲（いとあわせ）スタジオ、itoito（体験マッチングPF・構想中）
- note：探究学習・空間・学びについて発信中
- 10月に100人規模のフェス型こどもイベントを準備中

---

## 注意事項

- `index.html` は1ファイルで完結している。分割しない。
- 外部CSSファイルは作らない（メンテしにくいため）
- 画像はまだ入れていない。写真を追加するときはimages/フォルダを作ってそこに置く
- Google Fontsのimportは削除しない（デザインが崩れる）
