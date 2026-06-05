/*
 * SSG（静的サイト生成）スクリプト
 * microCMSから記事を取得し、各HTMLの SSG マーカー間に内容を焼き込む。
 *
 * 使い方: MICROCMS_API_KEY=xxx node scripts/build.mjs
 *
 * マーカー仕様:
 *   <!-- SSG:name -->...<!-- /SSG:name -->
 * 間の内容がビルド時に置き換わる。
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const MICROCMS_DOMAIN = process.env.MICROCMS_DOMAIN || 'hareruya-portfolio';
const MICROCMS_API_KEY = process.env.MICROCMS_API_KEY;
if(!MICROCMS_API_KEY){
  console.error('ERROR: MICROCMS_API_KEY 環境変数が必要です');
  process.exit(1);
}

// ── utils（utils.jsと同じロジック） ──
const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hasCategory = (p, cat) => Array.isArray(p.category) ? p.category.includes(cat) : p.category === cat;
const tagsOf = p => Array.isArray(p.tags) ? p.tags : (p.tags ? [p.tags] : []);
const firstImageOf = s => {
  const str = String(s ?? '');
  const m = str.match(/\[\[img:([^\]\s]+)\]\]/);
  if(m) return m[1];
  const t = str.match(/<img[^>]+src=["']([^"']+)["']/i);
  return t ? t[1] : '';
};
const coverUrlOf = p => p.cover?.url || p.thumbnailUrl || firstImageOf(p.content);
const coverWithSize = (p, params) => {
  const u = coverUrlOf(p);
  if(!u) return '';
  return p.cover?.url ? `${u}?${params}` : u;
};
const stripHtml = s => String(s ?? '')
  .replace(/\[\[img:[^\]]+\]\]/g,'')
  .replace(/<[^>]+>/g,'')
  .replace(/&nbsp;/g,' ')
  .replace(/\s+/g,' ')
  .trim();
const ymdOf = d => `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;

// ── microCMSから全件取得 ──
async function fetchAllPosts(){
  let all = [];
  let offset = 0;
  const limit = 100;
  while(true){
    const url = `https://${MICROCMS_DOMAIN}.microcms.io/api/v1/posts?limit=${limit}&offset=${offset}&orders=-publishedAt`;
    const res = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': MICROCMS_API_KEY }});
    if(!res.ok) throw new Error(`microCMS API error: ${res.status}`);
    const data = await res.json();
    all = all.concat(data.contents || []);
    offset += limit;
    if(offset >= (data.totalCount || 0)) break;
  }
  return all;
}

// ── マーカー間を置換 ──
function replaceMarked(html, name, content){
  const re = new RegExp(`(<!-- SSG:${name} -->)[\\s\\S]*?(<!-- /SSG:${name} -->)`);
  if(!re.test(html)){
    console.warn(`  ⚠️  マーカーが見つかりません: ${name}`);
    return html;
  }
  return html.replace(re, `$1\n${content}\n$2`);
}

// ── レンダラー：HOME HERO ──
function renderHero(posts){
  const heroes = posts
    .filter(p => hasCategory(p, 'Hero'))
    .sort((a, b) => (a.heroOrder ?? 999) - (b.heroOrder ?? 999))
    .slice(0, 3);
  if(!heroes.length){
    return `<div class="hero-slide"><div class="hero-empty">
      <div class="hero-empty-name">中丸晴留哉</div>
      <div class="hero-empty-sub">microCMS で category=Hero の記事を追加してください</div>
    </div></div>`;
  }
  const TITLE_MAX = 14;
  const EXCERPT_MAX = 45;
  return heroes.map(p => {
    const coverSrc = coverWithSize(p, 'w=2000&fit=crop');
    const cover = coverSrc ? `<img class="hero-slide-bg" src="${coverSrc}" alt="${escapeHtml(p.title)}">` : '';
    const titleStr = p.title.length > TITLE_MAX ? p.title.slice(0, TITLE_MAX) + '…' : p.title;
    const full = stripHtml(p.content);
    const excerpt = full.slice(0, EXCERPT_MAX) + (full.length > EXCERPT_MAX ? '…' : '');
    return `<div class="hero-slide">
      ${cover}
      <div class="hero-slide-content">
        <div class="hero-slide-title">${escapeHtml(titleStr)}</div>
        <div class="hero-slide-excerpt">${escapeHtml(excerpt)}</div>
      </div>
      <a class="hero-readmore" href="post.html?id=${encodeURIComponent(p.id)}">Read more →</a>
    </div>`;
  }).join('');
}

function renderHeroDots(posts){
  const heroes = posts.filter(p => hasCategory(p, 'Hero')).slice(0, 3);
  if(heroes.length <= 1) return '';
  return heroes.map((_, i) =>
    `<button class="hero-dot${i===0?' active':''}" data-idx="${i}" aria-label="slide ${i+1}"></button>`
  ).join('');
}

// ── レンダラー：HOME Works（上位5件、最初はfeatured） ──
function renderHomeWorks(posts){
  const works = posts.filter(p => hasCategory(p, 'Works')).slice(0, 5);
  if(!works.length){
    return '<div class="work-card"><div class="work-tags">作品がまだありません</div></div>';
  }
  return works.map((p, i) => {
    const tags = tagsOf(p);
    const tagsLine = tags.length ? tags.join(' / ') : '';
    const isFeatured = i === 0;
    const imgW = isFeatured ? 1600 : 800;
    const coverSrc = coverWithSize(p, `w=${imgW}&fit=crop`);
    const cover = coverSrc ? `<img src="${coverSrc}" alt="${escapeHtml(p.title)}">` : '';
    return `<a class="work-card${isFeatured ? ' featured' : ''}" href="post.html?id=${encodeURIComponent(p.id)}">
      <div class="work-cover">${cover}</div>
      <h3 class="work-title">${escapeHtml(p.title)}</h3>
      ${tagsLine ? `<div class="work-tags">${escapeHtml(tagsLine)}</div>` : ''}
    </a>`;
  }).join('');
}

// ── レンダラー：HOME Blog（上位5件） ──
function renderHomeBlog(posts){
  const blogs = posts.filter(p => hasCategory(p, 'Blog')).slice(0, 5);
  if(!blogs.length){
    return '<div class="blog-item"><div class="blog-text"><span class="blog-d">記事がまだありません</span></div></div>';
  }
  return blogs.map(p => {
    const d = new Date(p.publishedAt);
    const thumbSrc = coverWithSize(p, 'w=200&h=200&fit=crop');
    const thumb = thumbSrc ? `<img src="${thumbSrc}" alt="" loading="lazy">` : '';
    return `<a class="blog-item" href="post.html?id=${encodeURIComponent(p.id)}">
      <div class="blog-thumb">${thumb}</div>
      <div class="blog-text">
        <span class="blog-d">${escapeHtml(ymdOf(d))}</span>
        <h3 class="blog-title">${escapeHtml(p.title)}</h3>
      </div>
    </a>`;
  }).join('');
}

// ── レンダラー：blog.html 年ナビ + セクション ──
function renderBlogPage(posts){
  const blogs = posts.filter(p => hasCategory(p, 'Blog'));
  if(!blogs.length){
    return { yearNav: '', sections: '<div class="empty">記事がまだありません</div>' };
  }
  const byYear = {};
  for(const p of blogs){
    const y = new Date(p.publishedAt).getFullYear();
    (byYear[y] = byYear[y] || []).push(p);
  }
  const years = Object.keys(byYear).map(Number).sort((a,b) => b - a);

  const yearNav = years.map(y =>
    `<a href="#year-${y}" data-year="${y}">${y}<span class="yn-month"></span><span class="yn-line"></span></a>`
  ).join('');

  const sections = years.map(y => {
    const items = byYear[y].map(p => {
      const d = new Date(p.publishedAt);
      const tags = tagsOf(p);
      const tagsLine = tags.length ? tags.map(t => `#${t}`).join(' ') : '';
      const thumbSrc = coverWithSize(p, 'w=400&h=300&fit=crop');
      const thumb = thumbSrc ? `<img src="${thumbSrc}" alt="" loading="lazy">` : '';
      return `<a class="blog-item" data-year="${d.getFullYear()}" data-month="${String(d.getMonth()+1).padStart(2,'0')}" href="post.html?id=${encodeURIComponent(p.id)}">
        <div class="blog-thumb">${thumb}</div>
        <div class="blog-text">
          <div class="blog-meta">
            <span>${escapeHtml(ymdOf(d))}</span>
            ${tagsLine ? `<span class="blog-tags">${escapeHtml(tagsLine)}</span>` : ''}
          </div>
          <h3 class="blog-title">${escapeHtml(p.title)}</h3>
        </div>
      </a>`;
    }).join('');
    return `<section class="year-section" id="year-${y}">
      <div class="year-heading">
        <h2 class="year-heading-num">${y}</h2>
        <span class="year-heading-count">${byYear[y].length} posts</span>
      </div>
      <div class="blog-list">${items}</div>
    </section>`;
  }).join('');

  return { yearNav, sections };
}

// ── レンダラー：works.html フィルター + グリッド ──
function renderWorksPage(posts){
  const works = posts.filter(p => hasCategory(p, 'Works'));
  if(!works.length){
    return { filter: '', grid: '<div class="empty">作品がまだありません</div>' };
  }
  const tagCounts = {};
  works.forEach(p => tagsOf(p).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const allTags = Object.entries(tagCounts).sort((a,b) => b[1] - a[1]);

  const filter = `<button data-tag="" class="active">All (${works.length})</button>` +
    allTags.map(([t, n]) => `<button data-tag="${escapeHtml(t)}">${escapeHtml(t)} (${n})</button>`).join('');

  const grid = works.map(p => {
    const tags = tagsOf(p);
    const tagsLine = tags.length ? tags.join(' / ') : '';
    const cover = p.cover?.url
      ? `<img src="${p.cover.url}?w=800&fit=crop" alt="${escapeHtml(p.title)}">`
      : '';
    return `<a class="work-card" data-tags="${escapeHtml(tags.join('|'))}" href="post.html?id=${encodeURIComponent(p.id)}">
      <div class="work-cover">${cover}</div>
      <h3 class="work-title">${escapeHtml(p.title)}</h3>
      ${tagsLine ? `<div class="work-tags">${escapeHtml(tagsLine)}</div>` : ''}
    </a>`;
  }).join('');

  return { filter, grid };
}

// ── レンダラー：about プロフィール写真 ──
function renderAboutPhoto(posts){
  const post = posts.find(p => (p.title || '').includes('なかまるはれるや'));
  if(!post) return '';
  const cover = coverUrlOf(post);
  if(!cover) return '';
  const src = post.cover?.url ? `${cover}?w=800&fit=crop` : cover;
  return `<img src="${src}" alt="中丸晴留哉">`;
}

// ── main ──
(async () => {
  console.log('🔄 microCMSから記事を取得中…');
  const posts = await fetchAllPosts();
  console.log(`✅ ${posts.length}件取得`);

  // index.html
  const indexPath = join(ROOT, 'index.html');
  if(existsSync(indexPath)){
    let html = readFileSync(indexPath, 'utf-8');
    html = replaceMarked(html, 'hero', renderHero(posts));
    html = replaceMarked(html, 'hero-dots', renderHeroDots(posts));
    html = replaceMarked(html, 'home-works', renderHomeWorks(posts));
    html = replaceMarked(html, 'home-blog', renderHomeBlog(posts));
    writeFileSync(indexPath, html);
    console.log('✅ index.html 生成');
  }

  // blog.html
  const blogPath = join(ROOT, 'blog.html');
  if(existsSync(blogPath)){
    let html = readFileSync(blogPath, 'utf-8');
    const { yearNav, sections } = renderBlogPage(posts);
    html = replaceMarked(html, 'year-nav', yearNav);
    html = replaceMarked(html, 'blog-sections', sections);
    writeFileSync(blogPath, html);
    console.log('✅ blog.html 生成');
  }

  // works.html
  const worksPath = join(ROOT, 'works.html');
  if(existsSync(worksPath)){
    let html = readFileSync(worksPath, 'utf-8');
    const { filter, grid } = renderWorksPage(posts);
    html = replaceMarked(html, 'tag-filter', filter);
    html = replaceMarked(html, 'works-grid', grid);
    writeFileSync(worksPath, html);
    console.log('✅ works.html 生成');
  }

  // about.html
  const aboutPath = join(ROOT, 'about.html');
  if(existsSync(aboutPath)){
    let html = readFileSync(aboutPath, 'utf-8');
    html = replaceMarked(html, 'about-photo', renderAboutPhoto(posts));
    writeFileSync(aboutPath, html);
    console.log('✅ about.html 生成');
  }

  console.log('🎉 ビルド完了');
})().catch(e => {
  console.error('❌ エラー:', e);
  process.exit(1);
});
