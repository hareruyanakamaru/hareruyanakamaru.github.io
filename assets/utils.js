/*
 * 各ページで共有する microCMS 関連ユーティリティ。
 * 各ページの inline script より前に <script src="assets/utils.js"></script> を読み込むこと。
 */

const MICROCMS_DOMAIN = 'hareruya-portfolio';
const MICROCMS_API_KEY = 'oglpByvCLfiiCRxPnNqAEYUDMIy2MZnrgui6';

const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const categoryOf = p => Array.isArray(p.category) ? p.category[0] : p.category;

const hasCategory = (p, cat) => {
  const c = p.category;
  if(Array.isArray(c)) return c.includes(cat);
  return c === cat;
};

const tagsOf = p => Array.isArray(p.tags) ? p.tags : (p.tags ? [p.tags] : []);

const stripHtml = s => String(s ?? '')
  .replace(/\[\[img:[^\]]+\]\]/g,'')
  .replace(/<[^>]+>/g,'')
  .replace(/&nbsp;/g,' ')
  .replace(/\s+/g,' ')
  .trim();

const firstImageOf = s => {
  const str = String(s ?? '');
  const marker = str.match(/\[\[img:([^\]\s]+)\]\]/);
  if(marker) return marker[1];
  const tag = str.match(/<img[^>]+src=["']([^"']+)["']/i);
  return tag ? tag[1] : '';
};

const coverUrlOf = p => p.cover?.url || p.thumbnailUrl || firstImageOf(p.content);

const coverWithSize = (p, params) => {
  const u = coverUrlOf(p);
  if(!u) return '';
  return p.cover?.url ? `${u}?${params}` : u;
};
