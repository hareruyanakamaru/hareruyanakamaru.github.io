"""note.com の新着記事を microCMS に自動同期するスクリプト。

- 既存のmicroCMS記事のタイトル一覧を取得
- noteから全記事一覧を取得
- 既存にないものだけ POST で追加（thumbnailUrl・マーカー方式の本文画像つき）

GitHub Actions から実行される想定。環境変数：
  MICROCMS_API_KEY  ... POST権限のあるAPIキー
  NOTE_USERNAME     ... noteのユーザー名（itoawase 等）
  MICROCMS_DOMAIN   ... microCMSのドメイン名
"""
import os
import re
import sys
import time
import requests


NOTE_LIST_API = "https://note.com/api/v2/creators/{username}/contents"
NOTE_DETAIL_API = "https://note.com/api/v3/notes/{key}"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
}


def fetch_existing_titles(domain, api_key):
    """microCMSの既存Blog記事のタイトルセットを取得。"""
    titles = set()
    offset = 0
    limit = 100
    while True:
        url = f"https://{domain}.microcms.io/api/v1/posts?limit={limit}&offset={offset}&fields=title,category"
        r = requests.get(url, headers={"X-MICROCMS-API-KEY": api_key}, timeout=30)
        r.raise_for_status()
        data = r.json()
        for p in data.get("contents", []):
            cat = p.get("category", [])
            is_blog = (isinstance(cat, list) and "Blog" in cat) or cat == "Blog"
            if is_blog:
                titles.add(p.get("title", ""))
        total = data.get("totalCount", 0)
        offset += limit
        if offset >= total:
            break
    return titles


def fetch_all_note_summaries(username):
    """noteから全記事サマリーを取得。"""
    items = []
    page = 1
    while True:
        r = requests.get(
            NOTE_LIST_API.format(username=username),
            params={"kind": "note", "page": page},
            headers=HEADERS, timeout=30,
        )
        r.raise_for_status()
        data = r.json().get("data", {})
        contents = data.get("contents", [])
        items.extend(contents)
        if data.get("isLastPage", True) or not contents:
            break
        page += 1
        time.sleep(0.4)
    return items


def fetch_note_body(key):
    r = requests.get(NOTE_DETAIL_API.format(key=key), headers=HEADERS, timeout=30)
    r.raise_for_status()
    return r.json().get("data", {})


def html_to_markers(html, eyecatch_url=None):
    """microCMSが除去する <img> を [[img:URL]] マーカーへ変換。先頭にサムネを追加。"""
    out = re.sub(
        r'<img[^>]+src=["\']([^"\']+)["\'][^>]*/?>',
        lambda m: f'<p>[[img:{m.group(1)}]]</p>',
        html,
    )
    if eyecatch_url:
        marker = f'[[img:{eyecatch_url}]]'
        if marker not in out:
            out = f'<p>{marker}</p>' + out
    return out


def create_microcms_post(domain, api_key, summary, body_data):
    """microCMSへ新規Blog投稿を作成。"""
    title = summary.get("name", "")
    publish_at = summary.get("publishAt") or body_data.get("publish_at")
    body_html = body_data.get("body", "") or ""
    eyecatch = summary.get("eyecatch") or body_data.get("eyecatch") or ""

    payload = {
        "title": title,
        "content": html_to_markers(body_html, eyecatch),
        "category": ["Blog"],
    }
    if publish_at:
        payload["publishedAt"] = publish_at
    if eyecatch:
        payload["thumbnailUrl"] = eyecatch

    url = f"https://{domain}.microcms.io/api/v1/posts"
    headers = {"X-MICROCMS-API-KEY": api_key, "Content-Type": "application/json"}
    r = requests.post(url, headers=headers, json=payload, timeout=30)
    if r.status_code >= 300:
        raise RuntimeError(f"POST失敗: {r.status_code} {r.text[:200]}")
    return r.json().get("id")


def main():
    domain = os.environ.get("MICROCMS_DOMAIN", "hareruya-portfolio")
    api_key = os.environ.get("MICROCMS_API_KEY")
    username = os.environ.get("NOTE_USERNAME", "itoawase")

    if not api_key:
        print("ERROR: MICROCMS_API_KEY が設定されていません", file=sys.stderr)
        sys.exit(1)

    print(f"=== note → microCMS 自動同期 ===")
    print(f"username: {username}")
    print(f"domain:   {domain}")

    print("\n[1] microCMSの既存タイトル取得中...")
    existing = fetch_existing_titles(domain, api_key)
    print(f"    {len(existing)} 件の既存Blog記事")

    print("\n[2] noteから全記事一覧取得中...")
    summaries = fetch_all_note_summaries(username)
    print(f"    note記事: {len(summaries)} 件")

    new_ones = [s for s in summaries if s.get("name") not in existing]
    print(f"\n[3] 新規記事: {len(new_ones)} 件")

    if not new_ones:
        print("    新着なし。終了。")
        return

    new_ones.sort(key=lambda x: x.get("publishAt") or "")

    success = 0
    errors = 0
    for i, s in enumerate(new_ones, 1):
        print(f"\n[{i}/{len(new_ones)}] {s.get('name','')[:50]}")
        try:
            body = fetch_note_body(s["key"])
            time.sleep(0.5)
            new_id = create_microcms_post(domain, api_key, s, body)
            print(f"  → 作成 id={new_id}")
            success += 1
            time.sleep(0.6)
        except Exception as e:
            print(f"  エラー: {e}")
            errors += 1

    print(f"\n[done] 成功={success} エラー={errors}")
    if errors > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
