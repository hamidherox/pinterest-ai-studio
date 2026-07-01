async function generatePlacidComposite(title, imgUrl1, imgUrl2) {
  const token = (S.config.placidToken || '').trim();
  const uuid = (S.config.placidUuid || '').trim();
  const siteName = (S.config.siteName || '').trim();
  
  if (!token || !uuid) {
    log('  ⚠ Placid layout credentials missing in Settings. Aborting matrix execution block.', 'error');
    throw new Error('Placid configuration parameters missing.');
  }

  const exactToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  
  const payload = {
    "template_uuid": uuid,
    "create_now": true,
    "layers": {
      "title": { "text": title },
      "subline": { "text": siteName },
      "img1": { "image": imgUrl1 },
      "img2": { "image": imgUrl2 }
    }
  };

  const proxyUrl = "https://corsproxy.io/?";
  const targetUrl = "https://api.placid.app/api/rest/images/";

  // Set up a 90-second watchdog abort timer so our script controls the request lifespan
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000); 

  try {
    log('⚡ Dispatched layout requests via security bridge proxy...', 'info');
    
    let response;
    try {
      // Attempt 1: Try via CORS Proxy
      response = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
        method: 'POST',
        signal: controller.signal,
        headers: { 
          'Authorization': exactToken, 
          'Content-Type': 'application/json', 
          'Accept': 'application/json' 
        },
        body: JSON.stringify(payload)
      });
    } catch (proxyError) {
      // Attempt 2: If proxy fails or cuts out, immediately attempt direct bypass
      log('⚠ Proxy bottleneck detected or timed out. Initiating direct API bypass line...', 'warn');
      response = await fetch(targetUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: { 
          'Authorization': exactToken, 
          'Content-Type': 'application/json', 
          'Accept': 'application/json' 
        },
        body: JSON.stringify(payload)
      });
    }

    clearTimeout(timeoutId);

    // If both routes ultimately reject us
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Placid API Proxy Error Status ${response.status}: ${errText}`);
    }

    const json = await response.json();
    return json.image_url || json.url;

  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Placid API compilation execution surpassed maximum 90 second safe ceiling.');
    }
    throw error;
  }
}
