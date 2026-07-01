function saveConfig() {
  if (!window.S) window.S = {};
  
  // Safely extract text field element values matching index.html bindings
  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value : '';
  };

  S.config = {
    wp: getVal('cfg-wp'), // Fallback tracker
    wpSites: getVal('cfg-wp'),
    keywords: getVal('cfg-keywords'), // Fallback tracker
    keywordsData: getVal('cfg-keywords'),
    apikey: getVal('cfg-apikey'),
    provider: getVal('ai-provider'),
    placidToken: getVal('cfg-placid-token'),
    placidUuid: document.getElementById('cfg-placid-uuid') ? getVal('cfg-placid-uuid') : getVal('cfg-placid-uuid-dashboard'),
    hfToken: getVal('cfg-hf-token'),
    siteName: getVal('cfg-site-name'),
    
    // Core Sub-Model Engine & Dual Custom Layout Templates
    subModel: getVal('img-sub-model') || 'flux',
    promptTemplate1: getVal('promptTemplate1'),
    promptTemplate2: getVal('promptTemplate2')
  };

  try {
    localStorage.setItem('pinforge-core-v30', JSON.stringify(S.config));
  } catch (e) {
    console.error("Local storage allocation write error:", e);
  }
}

function loadConfig() {
  if (!window.S) window.S = {};
  
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  try {
    const raw = localStorage.getItem('pinforge-core-v30');
    if (!raw) {
      if (typeof toggleEngineModelDropdown === 'function') toggleEngineModelDropdown();
      return;
    }
    
    const c = JSON.parse(raw);
    
    // Populate Standard Security Key Gateways
    setVal('cfg-wp', c.wpSites || c.wp);
    setVal('cfg-keywords', c.keywordsData || c.keywords);
    setVal('cfg-apikey', c.apikey);
    setVal('cfg-placid-token', c.placidToken);
    setVal('cfg-placid-uuid', c.placidUuid);
    setVal('cfg-hf-token', c.hfToken);
    setVal('cfg-site-name', c.siteName);
    
    // Bind Dynamic Engine Selectors & Core Prompt Templates
    if (c.provider && document.getElementById('ai-provider')) {
      document.getElementById('ai-provider').value = c.provider;
    }
    if (c.subModel && document.getElementById('img-sub-model')) {
      document.getElementById('img-sub-model').value = c.subModel;
    }
    
    setVal('promptTemplate1', c.promptTemplate1 || "High-res professional food photography of {title}, luxury plating, cinematic lighting, macro close up --ar 2:3");
    setVal('promptTemplate2', c.promptTemplate2 || "Gourmet preparation shot of ingredients for {title}, rustic studio lighting, editorial style --ar 2:3");

    S.config = c;
    
    renderWPSites();
    if (typeof toggleEngineModelDropdown === 'function') toggleEngineModelDropdown();
  } catch (e) {
    console.error("Failed loading local core configuration parameters:", e);
  }
}

function renderWPSites() {
  const wpTextarea = document.getElementById('cfg-wp');
  const wrap = document.getElementById('wp-sites-preview');
  if (!wrap) return;
  
  const lines = (wpTextarea ? wpTextarea.value : '').split('\n').filter(Boolean);
  if (!lines.length) {
    wrap.innerHTML = '';
    return;
  }
  
  wrap.innerHTML = lines.map(line => {
    const parts = line.split('##');
    const name = parts[0];
    const url = parts[1];
    return `<div class="wp-site-row" style="margin-bottom:6px; font-size:13px;"><strong>${name || '?'}</strong> - <span style="color:var(--muted);">${url || ''}</span></div>`;
  }).join('');
}
