/*
 * 全ページ共通のヘッダー・フッターを注入する。
 * 各ページの <body> 直後に <div id="nav-mount"></div> と <div id="footer-mount"></div> を置いてください。
 * 更新はこのファイルだけでOK。
 */
(function(){
  const NAV_HTML = `
<nav>
  <a class="brand" href="index.html">
    <img class="brand-logo" src="images/logo/logo-horizontal-light.png" alt="絲 いとあわせ">
  </a>
  <ul class="nav-links">
    <li><a href="about.html">About</a></li>
    <li><a href="works.html">Works</a></li>
    <li><a href="blog.html">Blog</a></li>
    <li><a href="index.html#contact">Contact</a></li>
  </ul>
</nav>`;

  const FOOTER_HTML = `
<footer>
  <div class="footer-grid">
    <div class="footer-brand">
      <img class="brand-logo" src="images/logo/logo-horizontal-navy.png" alt="絲 いとあわせ">
    </div>
    <div class="footer-social">
      <a href="https://www.facebook.com/profile.php?id=100004436648159" target="_blank" rel="noopener" aria-label="Facebook">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 13.5h2.5l.5-3H14v-2c0-.86 0-1.5 1.5-1.5h1.5V4.14c-.32-.04-1.78-.14-3.13-.14C11.05 4 9 5.71 9 8.6V10.5H6.5v3H9V21h5z"/></svg>
      </a>
      <a href="https://www.instagram.com/harerunakama033/" target="_blank" rel="noopener" aria-label="Instagram">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="5"/>
          <circle cx="12" cy="12" r="4"/>
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
        </svg>
      </a>
      <a href="https://twitter.com/itoawase0324" target="_blank" rel="noopener" aria-label="X (Twitter)">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </a>
      <a href="https://note.com/itoawase" target="_blank" rel="noopener" aria-label="note">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" fill-rule="evenodd">
          <path d="M6 2H18A4 4 0 0122 6V18A4 4 0 0118 22H6A4 4 0 012 18V6A4 4 0 016 2ZM7 7.5V17H9.4V10.5H14.6V17H17V7.5H7Z"/>
        </svg>
      </a>
    </div>
  </div>
  <div class="footer-bottom">
    <span class="footer-copy">© ${new Date().getFullYear()} Hareruya Nakamaru / Ito Studio</span>
  </div>
</footer>`;

  function mount(){
    const navMount = document.getElementById('nav-mount');
    if(navMount) navMount.outerHTML = NAV_HTML;
    const footerMount = document.getElementById('footer-mount');
    if(footerMount) footerMount.outerHTML = FOOTER_HTML;

    // スクロール検知でnavに .scrolled を付与
    const navEl = document.querySelector('nav');
    if(navEl){
      const onScroll = () => {
        if(window.scrollY > 40) navEl.classList.add('scrolled');
        else navEl.classList.remove('scrolled');
      };
      window.addEventListener('scroll', onScroll, {passive:true});
      onScroll();
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', mount);
  }else{
    mount();
  }
})();
