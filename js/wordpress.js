async function uploadUrlToWP(imageUrl, title, site) {
  try {
    const auth = 'Basic ' + btoa(`${site.email}:${site.pass}`);
    let bodyData = { title: title, status: 'publish' };
    if (imageUrl.startsWith('data:')) { bodyData.file = imageUrl; } else { bodyData.source_url = imageUrl; }
    const r = await fetch(`${site.url}/wp-json/wp/v2/media`, { method: 'POST', headers: { 'Authorization': auth, 'Content-Type': 'application/json' }, body: JSON.stringify(bodyData) });
    const d = await r.json();
    return { id: d.id || null, url: d.source_url || imageUrl };
  } catch (e) { return { id: null, url: imageUrl }; }
}

async function publishPostWP(article, mediaId, site) {
  try {
    const auth = 'Basic ' + btoa(`${site.email}:${site.pass}`);
    const body = { title: article.seoTitle, content: article.html, status: 'publish', excerpt: article.description };
    if (mediaId) body.featured_media = mediaId;
    const res = await fetch(`${site.url}/wp-json/wp/v2/posts`, { method: 'POST', headers: { 'Authorization': auth, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await res.json(); return { url: d.link || '', id: d.id || null };
  } catch (e) { return { url: '', id: null }; }
}

function getSite(websiteName) {
  const lines = (S.config.wp || '').split('\n').filter(Boolean);
  for (const line of lines) {
    const [name, url, email, pass] = line.split('##');
    if (name && websiteName && websiteName.toLowerCase().includes(name.toLowerCase()))
      return { name, url: url.trim(), email: email.trim(), pass: pass.trim() };
  }
  return null;
}

function injectLinks(html) {
  const lines = (S.config.keywords || '').split('\n').filter(Boolean);
  let out = html;
  for (const line of lines) {
    const [kw, link] = line.split('##');
    if (!kw || !link) continue;
    const re = new RegExp(`\\b(${kw.trim()})\\b`, 'i');
    if (!out.includes(`href="${link.trim()}`)) out = out.replace(re, `<a href="${link.trim()}" target="_blank">$1</a>`);
  }
  return out;
}