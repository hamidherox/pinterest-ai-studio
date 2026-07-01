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

  // Safe open server-to-server bridge proxy to handle client-side header security rules
  const proxyUrl = "https://corsproxy.io/?";
  const targetUrl = "https://api.placid.app/api/rest/images/";

  // 💡 FIX: Create a 90-second AbortController watchdog so our script controls the timeout windows
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds

  try {
    const response = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
      method: 'POST',
      signal: controller.signal, // 💡 Pass the timeout signal here
      headers: { 
        'Authorization': exactToken, 
        'Content-Type': 'application/json', 
        'Accept': 'application/json' 
      },
      body: JSON.stringify(payload)
    });

    clearTimeout(timeoutId); // Clear timeout if it succeeds on time

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Placid API Proxy Error Status ${response.status}: ${errText}`);
    }

    const json = await response.json();
    return json.image_url || json.url;

  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Placid API Request timed out after 90 seconds.');
    }
    throw error;
  }
}
