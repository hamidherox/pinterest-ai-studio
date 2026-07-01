async function generatePlacidComposite(title, imgUrl1, imgUrl2) {
  const uuid = (S.config.placidUuid || '').trim();
  const siteName = (S.config.siteName || '').trim();
  
  if (!uuid) {
    log('  ⚠ Placid Template UUID missing in Settings. Aborting matrix execution block.', 'error');
    throw new Error('Placid configuration parameters missing.');
  }

  log('⚡ Rendering layout seamlessly via Placid URL API...', 'info');

  // 1. Define the base URL API endpoint from the documentation
  const baseUrl = `https://api.placid.app/u/${uuid}`;
  
  // 2. Map your text and image parameters into the layer properties
  const params = new URLSearchParams({
    "title[text]": title,
    "subline[text]": siteName,
    "img1[image]": imgUrl1,
    "img2[image]": imgUrl2
  });

  // 3. Combine them into a clean single string URL
  const finalPlacidUrl = `${baseUrl}?${params.toString()}`;
  
  // 4. Return it instantly to the WordPress pipeline!
  return finalPlacidUrl;
}
