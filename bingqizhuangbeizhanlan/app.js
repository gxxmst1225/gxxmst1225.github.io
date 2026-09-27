(() => {
  const data = window.EXHIBIT_DATA;
  const app = document.getElementById('app');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = (value) => String(value ?? '').trim();
  const asset = (name) => data.assets?.[name];
  const media = (name, eager=false) => {
    const a = asset(name);
    if (!a) return '';
    const loading = eager ? 'eager' : 'lazy';
    const srcset = a.webp480 && a.webp1200 ? `${a.webp480} 480w, ${a.webp1200} 1200w` : '';
    return `<figure class="media-frame"><picture>${srcset ? `<source type="image/webp" srcset="${srcset}" sizes="(max-width: 760px) 100vw, 900px">` : ''}<img src="${a.original}" ${srcset ? `srcset="${srcset}" sizes="(max-width: 760px) 100vw, 900px"` : ''} alt="" loading="${loading}" decoding="async"></picture></figure>`;
  };
  const paragraphs = (text, cls='') => normalize(text) ? `<div class="${cls}">${esc(text)}</div>` : '';
  const nav = (label, href='#/') => `<div class="topbar"><a class="icon-btn" href="${href}" aria-label="返回">←</a><div class="brand-mini">${esc(label)}</div><div class="topbar-spacer"></div><a class="icon-btn" href="#/directory" aria-label="目录">⌂</a></div>`;
  const footer = () => `<footer>${esc(data.title)}<br>${esc(data.subtitle)}</footer>`;
  const safeIndex = (v, max) => Number.isInteger(v) && v >= 0 && v < max;
  const parseRoute = () => {
    const raw = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    if (!raw) return {kind:'home'};
    const p = raw.split('/').filter(Boolean);
    if (p[0] === 'directory' && p.length === 1) return {kind:'directory'};
    if (p[0] !== 'section') return {kind:'error'};
    const si = Number(p[1]);
    if (!safeIndex(si, data.sections.length)) return {kind:'error'};
    if (p.length === 2) return {kind:'section', si};
    if (p[2] !== 'sub') return {kind:'error'};
    const sj = Number(p[3]);
    if (!safeIndex(sj, data.sections[si].subsections.length)) return {kind:'error'};
    if (p.length === 4) return {kind:'sub', si, sj};
    if (p[4] !== 'article') return {kind:'error'};
    const ai = Number(p[5]);
    if (!safeIndex(ai, data.sections[si].subsections[sj].articles.length)) return {kind:'error'};
    return {kind:'article', si, sj, ai};
  };
  const renderHome = () => {
    const cards = data.sections.map((s, i) => `<a class="directory-card" href="#/section/${i}"><span class="directory-card-title">${esc(s.title)}</span><span class="directory-card-mark" aria-hidden="true">›</span></a>`).join('');
    app.innerHTML = `<main class="site"><header class="hero"><div class="hero-inner"><h1 class="hero-title">${esc(data.title)}</h1><h2 class="hero-subtitle">${esc(data.subtitle)}</h2><div class="gold-rule"></div></div></header><div class="page-wrap"><section class="directory-panel"><a class="section-heading section-heading-link" href="#/directory"><span>${esc(data.tocTitle)}</span><span class="directory-card-mark" aria-hidden="true">›</span></a><div class="directory-grid">${cards}</div></section></div>${footer()}</main>`;
  };
  const renderDirectory = () => {
    const sections = data.sections.map((s, si) => {
      const subs = s.subsections.map((sub, sj) => {
        const articles = sub.articles.map((art, ai) => `<a class="directory-tree-article" href="#/section/${si}/sub/${sj}/article/${ai}">${esc(art.title)}</a>`).join('');
        return `<section class="directory-tree-subsection"><a class="directory-tree-subtitle" href="#/section/${si}/sub/${sj}">${esc(sub.title)}</a><div class="directory-tree-articles">${articles}</div></section>`;
      }).join('');
      return `<section class="directory-tree-section"><a class="directory-tree-title" href="#/section/${si}">${esc(s.title)}</a><div class="directory-tree-subsections">${subs}</div></section>`;
    }).join('');
    app.innerHTML = `<main class="site">${nav(data.tocTitle)}<div class="page-wrap"><section class="section-hero"><h1 class="view-title">${esc(data.tocTitle)}</h1></section><div class="directory-tree">${sections}</div></div>${footer()}</main>`;
  };
  const renderSection = (si) => {
    const s = data.sections[si];
    const cards = s.subsections.map((sub, sj) => {
      const imgs = (sub.introImages || []).map(n => media(n)).join('');
      return `<a class="topic-card" href="#/section/${si}/sub/${sj}"><div class="topic-title">${esc(sub.title)}</div>${paragraphs(sub.overview,'topic-overview')}${imgs ? `<div class="topic-intro-media">${imgs}</div>` : ''}<div class="topic-link-hint" aria-hidden="true">›</div></a>`;
    }).join('');
    app.innerHTML = `<main class="site">${nav(s.title)}<div class="page-wrap"><section class="section-hero"><h1 class="view-title">${esc(s.title)}</h1>${paragraphs(s.overview,'view-overview')}</section><section class="list-stack">${cards}</section></div>${footer()}</main>`;
  };
  const renderSub = (si, sj) => {
    const s = data.sections[si]; const sub = s.subsections[sj];
    // Level-three entries are rendered in full on the topic page.  The title remains a
    // link for deep linking, but the visitor no longer has to open each entry first.
    const cards = sub.articles.map((art, ai) => {
      const flow = (art.bodyParagraphs || []).map(bp => `${(bp.images || []).map(n => media(n, false)).join('')}${normalize(bp.text) ? `<p>${esc(bp.text)}</p>` : ''}`).join('');
      return `<article class="article-inline" id="article-${ai}"><h2 class="article-link-title"><a href="#/section/${si}/sub/${sj}/article/${ai}">${esc(art.title)}</a></h2>${flow}</article>`;
    }).join('');
    const introMedia=(sub.introImages || []).map(n => media(n)).join('');
    app.innerHTML = `<main class="site">${nav(sub.title, `#/section/${si}`)}<div class="page-wrap"><section class="section-hero"><h1 class="view-title">${esc(sub.title)}</h1>${paragraphs(sub.overview,'view-overview')}${introMedia ? `<div class="topic-intro-media">${introMedia}</div>` : ''}</section><section class="list-stack article-inline-list">${cards}</section></div>${footer()}</main>`;
  };
  const renderArticle = (si, sj, ai) => {
    const s=data.sections[si]; const sub=s.subsections[sj]; const art=sub.articles[ai];
    const flow=(art.bodyParagraphs || []).map(bp => `${(bp.images || []).map(n => media(n,true)).join('')}${normalize(bp.text) ? `<p>${esc(bp.text)}</p>` : ''}`).join('');
    app.innerHTML = `<main class="site">${nav(art.title, `#/section/${si}/sub/${sj}`)}<div class="page-wrap"><article class="article-flow"><h1 class="article-title">${esc(art.title)}</h1><div class="route-meta">${esc(s.title)} · ${esc(sub.title)}</div>${flow}</article></div>${footer()}</main>`;
  };
  const renderError = () => { app.innerHTML=`<main class="site">${nav(data.title)}<div class="page-wrap"><div class="error-card">${esc(data.title)}</div></div></main>`; };
  const render = () => { const r=parseRoute(); if(r.kind==='home') renderHome(); else if(r.kind==='directory') renderDirectory(); else if(r.kind==='section') renderSection(r.si); else if(r.kind==='sub') renderSub(r.si,r.sj); else if(r.kind==='article') renderArticle(r.si,r.sj,r.ai); else renderError(); requestAnimationFrame(() => window.scrollTo(0,0)); };
  window.addEventListener('hashchange', render);
  render();
})();
