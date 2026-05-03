# 中丸晴留哉 ポートフォリオサイト — Claude Code 作業ガイド

## チーム編成

| 役割 | 担当 | 内容 |
|---|---|---|
| **オーナー** | 中丸晴留哉（はれるや） | 全体方針／コンテンツ判断／ブランディング最終決定／SNS運用／microCMS管理画面の操作（記事追加・スキーマの選択肢追加など）／ドメイン・GitHubアカウント管理 |
| **CEO / CTO** | Claude Code | コード実装（HTML/CSS/JS）／microCMS API連携の設計・実装／デザイン案の提案／Git運用／CLAUDE.md整備／設計上のトレードオフ整理 |

**役割の境界:**
- 「管理画面でクリックすれば済む作業」 → オーナー
- 「コード変更／API／設計」 → CEO
- 「文章・キャッチコピーの最終判断」 → オーナー（CEOは下案を出す）
- microCMSの**スキーマ変更**（フィールド追加・選択肢追加）は管理画面でしかできない

---

## このプロジェクトについて

中丸晴留哉（はれるや）のポートフォリオサイト。
GitHub Pages で静的HTMLとして公開している。

**サイトURL:** https://hareruyanakamaru.github.io/  
**リポジトリ:** https://github.com/hareruyanakamaru/hareruyanakamaru.github.io  
**microCMS管理画面:** https://hareruya-portfolio.microcms.io/

---

## ファイル構成

```
/
├── index.html              # トップ（Hero/Concept/Service/Works/Blog/Contact CTA）
├── about.html              # プロフィールページ
├── works.html              # 制作実績一覧
├── blog.html               # ブログ一覧
├── post.html               # 記事個別ページ（?id=xxx で動的に表示）
├── og-image.jpg            # OG画像
├── CLAUDE.md               # このファイル
├── images/
│   └── logo/
│       ├── logo-horizontal-light.png   # 透過、明るい背景用（ヘッダー）
│       ├── logo-horizontal-navy.png    # 透過、紺背景用（フッター）
│       ├── logo-square-light.png
│       └── logo-square-navy.png
├── assets/
│   ├── chrome.css          # 全ページ共通の nav/footer スタイル
│   └── chrome.js           # nav/footer のHTML注入＋スクロール挙動
├── scripts/
│   └── sync_note_to_microcms.py    # note→microCMS 自動同期スクリプト
└── .github/workflows/
    └── sync-note.yml       # 毎日0時(JST)に自動同期するGitHub Actions
```

---

## 共通ヘッダー・フッターの仕組み（重要）

各ページには以下が入っているだけ：
```html
<link rel="stylesheet" href="assets/chrome.css">
<div id="nav-mount"></div>
...
<div id="footer-mount"></div>
<script src="assets/chrome.js"></script>
```

`chrome.js` がDOMContentLoaded時に `#nav-mount` と `#footer-mount` を最新の nav/footer に置き換える。
**nav/footer のテキストやリンク、SNSアイコンを変えたいときは `assets/chrome.js` だけを編集する**（5ページ全てに反映される）。
スタイル調整は `assets/chrome.css`。

---

## microCMS運用メモ

- **エンドポイント:** `posts` （リスト形式）
- **フィールド:**
  - `title` ... テキスト
  - `category` ... 複数選択（Works / Blog / Hero、複数選択可）
  - `tags` ... 複数選択
  - `cover` ... 画像（microCMS-hosted のみ）
  - `content` ... リッチエディタ
  - `thumbnailUrl` ... テキスト（外部URL用）※2026-05-04追加
  - `heroOrder` ... 数値（Hero表示順）
- **APIキー:** `oglpByvCLfiiCRxPnNqAEYUDMIy2MZnrgui6` (gui6) — GET/POST/PATCH ON。ソース埋め込み公開状態。
  リスク許容（A案）。DELETE は OFF にしておくこと。
- **記事の追加（手動）:** microCMS管理画面 → 「+ 追加」→ 入力 → 「公開」 → サイトに自動反映
- **note記事:** GitHub Actions が毎日 0:00 JST に noteから自動同期する（後述）

### サムネ表示の優先順位（重要）
表示側の `coverUrlOf(p)` ヘルパー：
1. `p.cover.url` （microCMS-hosted、手動投稿用）
2. `p.thumbnailUrl` （外部URL、note自動同期用）
3. 本文先頭の `[[img:URL]]` マーカー or `<img>` タグ

---

## note → microCMS 自動同期（2026-05-04 導入）

### 仕組み
- GitHub Actions `.github/workflows/sync-note.yml` が **毎日 0:00 JST** に実行
- `scripts/sync_note_to_microcms.py` が note からBlog記事を取得しmicroCMSに POST
- 既存タイトル比較で**新規分のみ**追加
- 手動トリガーも可能（GitHub UI の Actions タブ → Run workflow）

### 仕様の制約と対策
microCMS の Content API キーで取得した本文には外部 `<img>` タグが**自動除去**される（リッチエディタの仕様）。
そのため：

- 本文中の画像は `<img src="X">` を `[[img:X]]` というプレーンテキストの**マーカー**に変換して保存
- 表示時、`post.html` の `renderContent()` がマーカーを `<img>` タグに**復元**
- サムネは `thumbnailUrl` フィールド（テキスト）に外部URLを直接保存

### 認証
- `MICROCMS_API_KEY` (= gui6 のキー) は GitHub Secrets に登録済み
- ワークフロー側で `secrets.MICROCMS_API_KEY` として参照

### note ユーザー
- アカウント: `itoawase`（環境変数 `NOTE_USERNAME`）

---

## デザインルール

- **フォント:** Noto Serif JP（本文・見出し・ナビ）+ DM Mono（英字ラベル・カテゴリ）
- **カラー:**
  - `--paper: #f4f1e8`（背景）
  - `--ink: #1c1a16`（テキスト）
  - `--orange: #c8651a`（アクセント①）
  - `--green: #3d6b38`（アクセント②）
  - `--muted: #7a7568`（補足テキスト）
  - `--navy: #00157a`（フッター背景／ロゴ紺と完全一致）
- **雰囲気:** 和紙×モノスペース。落ち着いた職人感。派手にしない。
- **アニメーション:** スクロール時のフェードアップ／nav は scale+blur で登場 ／ ロゴはスクロールで上に消える

---

## よく使う作業パターン

### 記事を1件追加する（手動）
microCMS管理画面で「+ 追加」→ 公開、で完了（コードpush不要）。

### nav/footer の文言を変える
`assets/chrome.js` の `NAV_HTML` または `FOOTER_HTML` を編集。

### nav/footer のスタイルを変える
`assets/chrome.css` を編集。

### Hero に表示する記事を増やす
microCMS で記事の `category` に `Hero` を追加し、`heroOrder` を設定。

### note ユーザー名を変える
`.github/workflows/sync-note.yml` の `NOTE_USERNAME` 環境変数を変更。

---

## サイトの目的（2026-05-03 確定版）

> SNSやリアルで信頼関係を作った相手が訪れた時に「世界観」と「実績の積み上げ」が伝わるサイト。
> 主読者：A. 新規仕事相談者（イベント主催・教育機関・自治体・企業）+ D. コラボ希望者・仲間。
> 来訪体験：「この人に頼みたい」「世界観が好き」。
> CTA優先順：①紹介してもらう ②仕事の問い合わせ ③SEO（教育・イベント企画運営の検索流入）。
> → コールドトラフィックの獲得より、温度感ある人との関係深化を優先する設計。

---

## 依頼するときの書き方

```
# 追加・更新
「〇〇セクションに、△△を追加して」

# デザイン変更
「Contactボタンの色をorangeに変えて」
「Heroのキャッチコピーを〇〇に変更して」

# 新規ページ
「〇〇ページを新しく作って。共通ヘッダー/フッターを使う形で」
```

---

## GitHubへのデプロイ

```bash
git add .
git commit -m "変更内容のメモ"
git push origin main
```

数分で GitHub Pages に反映される。

注意：`.github/workflows/` 以下の編集は GitHub PAT に `workflow` スコープが必要。
スコープがない場合は GitHub の Web UI で直接編集する。

---

## はれるやについて（コンテキスト）

- 本名：中丸晴留哉
- 拠点：東京都江東区
- 前職：公立中学校 数学教師（10年）
- 現在：フリーランス（空間デザイン・イベント制作・探究学習）
- プロジェクト：絲（いとあわせ）スタジオ
- note：探究学習・空間・学びについて発信中（itoawase）

---

## 注意事項

- 共通nav/footerは `assets/chrome.{css,js}` で管理。各ページ個別に書かない。
- ロゴは透過PNG（`images/logo/*.png`）。JPG版（`*.jpg`）は予備として残してある。
- Google Fontsのimportは削除しない。
- microCMSのAPIキー（gui6）は POST/PATCH 権限がONで放置中（A案）。誰でも書き込める状態であることを念頭に。
