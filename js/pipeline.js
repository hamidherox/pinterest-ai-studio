async function startGeneration() {
  if (!S.rows.length) { showToast('Upload an Excel file first'); return; }
  saveConfig();
  const doWP = document.getElementById('toggle-wp').classList.contains('on');
  const doImg = document.getElementById('toggle-img').classList.contains('on');
  const subModel = document.getElementById('img-sub-model').value;
  
  const dates = Array.from({length: S.rows.length}, (_, i) => {
    let d = new Date(); d.setHours(d.getHours() + i * 2);
    return d.toISOString().replace('T', ' ').substring(0, 16);
  });

  document.getElementById('btn-generate').disabled = true;
  S.posts = [];
  document.getElementById('img-grid-wrap').innerHTML = '';
  document.getElementById('preview-tbody').innerHTML = '';
  let pubCount = 0, imgCount = 0;

  for (let i = 0; i < S.rows.length; i++) {
    const row = S.rows[i];
    setProgress(Math.round(((i + 1) / S.rows.length) * 100), `Row ${i + 1}/${S.rows.length}`);
    log(`Starting pipeline block: "${row.title}"`, 'info');

    let finalPinUrl = '', articleUrl = '', wpStatus = 'skipped';
    
    const article = await generateArticle(row.title, row.website);
    log('  ✓ Text layout copywriting generated successfully.', 'success');

    if (doImg) {
      log('  Constructing photorealistic prompt structures via Pollinations...', 'info');
      const prompt1 = getCustomImagePrompt(row.title, 1);
      const img1 = getAIImageUrl(prompt1, subModel, 1);
      
      const prompt2 = getCustomImagePrompt(row.title, 2);
      const img2 = getAIImageUrl(prompt2, subModel, 2);
      
      log('  Sending BOTH variant images to Placid Studio...', 'info');
      try {
        finalPinUrl = await generatePlacidComposite(row.title, img1, img2);
        imgCount++;
        log('  ✓ Placid composite image generated successfully.', 'success');
      } catch (err) {
        log(`  ❌ Placid creation failed: ${err.message}. Using Image 1 fallback rule.`, 'error');
        finalPinUrl = img1; 
      }
      
      const card = document.createElement('div');
      card.className = 'img-card';
      card.innerHTML = `<img src="${finalPinUrl}"><span class="img-status">Pin Verified</span>`;
      document.getElementById('img-grid-wrap').appendChild(card);
    }

    if (doWP) {
      const site = getSite(row.website);
      if (site) {
        let mediaId = null;
        if (finalPinUrl) {
          log('  Uploading Placid Final Pin to WordPress Media Library...', 'info');
          const m = await uploadUrlToWP(finalPinUrl, row.title, site);
          mediaId = m.id; 
          if (mediaId) {
            log('  ✓ Placid Pin attached as active Featured Image.', 'success');
          }
        }
        const linkedArticle = { ...article, html: injectLinks(article.html) };
        const wp = await publishPostWP(linkedArticle, mediaId, site);
        if (wp.url) { 
          articleUrl = wp.url; 
          wpStatus = 'published'; 
          pubCount++; 
          log(`  ✓ Article Published: ${wp.url}`, 'success'); 
        }
      }
    }

    S.posts.push({ 
      title: row.title, 
      board: row.board, 
      imageUrl: finalPinUrl, 
      articleUrl, 
      description: article.description, 
      date: dates[i], 
      keywords: article.keywords 
    });

    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${row.title}</td><td>${row.board}</td><td><a href="${finalPinUrl}" target="_blank">Placid Pin Link</a></td><td>${article.description || ''}</td><td>${wpStatus}</td>`;
    document.getElementById('preview-tbody').appendChild(tr);
  }

  document.getElementById('stat-published').textContent = pubCount;
  document.getElementById('stat-images').textContent = imgCount;
  document.getElementById('btn-generate').disabled = false;
  document.getElementById('btn-export').disabled = false;
  document.getElementById('btn-export2').disabled = false;
  setProgress(100, 'Loop completed.');
}