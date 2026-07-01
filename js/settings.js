function saveConfig() {
  S.config = {
    wp: document.getElementById('cfg-wp').value,
    keywords: document.getElementById('cfg-keywords').value,
    apikey: document.getElementById('cfg-apikey').value,
    provider: document.getElementById('ai-provider').value,
    placidToken: document.getElementById('cfg-placid-token').value,
    placidUuid: document.getElementById('cfg-placid-uuid').value,
    hfToken: document.getElementById('cfg-hf-token').value,
    siteName: document.getElementById('cfg-site-name').value,
    promptTpl: document.getElementById('cfg-prompt-tpl').value
  };
  try {
    localStorage.setItem('pinforge-core-v30', JSON.stringify(S.config));
  } catch (e) {}
}

function loadConfig() {
  try {
    const raw = localStorage.getItem('pinforge-core-v30');
    if (!raw) {
      toggleEngineModelDropdown();
      return;
    }
    const c = JSON.parse(raw);
    document.getElementById('cfg-wp').value = c.wp || '';
    document.getElementById('cfg-keywords').value = c.keywords || '';
    document.getElementById('cfg-apikey').value = c.apikey || '';
    document.getElementById('cfg-placid-token').value = c.placidToken || '';
    document.getElementById('cfg-placid-uuid').value = c.placidUuid || '';
    document.getElementById('cfg-hf-token').value = c.hfToken || '';
    document.getElementById('cfg-site-name').value = c.siteName || '';
    document.getElementById('cfg-prompt-tpl').value = c.promptTpl || 'food photography, [$title]::1, tilt shift, branding composition...';
    if (c.provider) document.getElementById('ai-provider').value = c.provider;
    S.config = c;
    renderWPSites();
    toggleEngineModelDropdown();
  } catch (e) {}
}

function renderWPSites() {
  const lines = (document.getElementById('cfg-wp').value || '').split('\n').filter(Boolean);
  const wrap = document.getElementById('wp-sites-preview');
  if (!wrap) return;
  if (!lines.length) {
    wrap.innerHTML = '';
    return;
  }
  wrap.innerHTML = lines.map(line => {
    const [name, url] = line.split('##');
    return `<div class="wp-site-row"><span>${name || '?'}</span> - <span style="color:var(--muted);">${url || ''}</span></div>`;
  }).join('');
}