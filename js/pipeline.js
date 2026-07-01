async function startGeneration() {
  if (S.rows.length === 0) {
    alert("No rows loaded! Please import an Excel sheet first.");
    return;
  }

  log(`🚀 Launching production pipeline for ${S.rows.length} structural entries...`, 'info');
  let pubCount = 0;

  for (let i = 0; i < S.rows.length; i++) {
    const row = S.rows[i];
    log(`--------------------------------------------------`, 'info');
    log(`[Row ${i + 1}/${S.rows.length}] Processing topic: "${row.title}"`, 'info');

    let finalPinUrl = '';
    let articleUrl = '';
    let wpStatus = 'failed';

    try {
      // 1. Text Copywriting Generation
      const article = await generateArticle(row.title, row.website);
      log(`  ✓ Recipe copy generated dynamically via AI.`, 'success');

      // 2. Generate Dual Visual Prompts via Settings Configuration Matrix
      const template1 = S.config.promptTemplate1 || "food photography, {title}::1, tilt shift, branding composition, high detail, luxury dinner table, professional magazine ad";
      const template2 = S.config.promptTemplate2 || "Gourmet preparation shot of ingredients for {title}, rustic studio lighting, editorial style --ar 2:3";

      // Dynamically clean structural string replacements
      const prompt1 = template1.replace(/{title}/g, row.title).replace(/\[\$title\]/g, row.title);
      const prompt2 = template2.replace(/{title}/g, row.title).replace(/\[\$title\]/g, row.title);

      const selectedModel = S.config.subModel || 'flux'; 

      const imgUrl1 = getAIImageUrl(prompt1, selectedModel, 1);
      const imgUrl2 = getAIImageUrl(prompt2, selectedModel, 2);
      log(`  Generated twin creative asset targets using model: ${selectedModel}`, 'info');

      // 3. Connect to Placid Composite Canvas Engine
      const placidElement = document.getElementById('enable-placid');
      const usePlacid = placidElement ? placidElement.classList.contains('on') : true;

      if (usePlacid) {
        try {
          log('  Sending variant images to Placid Studio...', 'info');
          finalPinUrl = await generatePlacidComposite(row.title, imgUrl1, imgUrl2);
          log('  ✓ Placid high-resolution multi-layer pin generated!', 'success');
        } catch (placidErr) {
          log(`  ❌ Placid layout compilation failed: ${placidErr.message}. Defaulting to Image 1 route.`, 'warn');
          finalPinUrl = imgUrl1;
        }
      } else {
        log('  Bypassing Placid layout composite. Routing raw primary image track.', 'info');
        finalPinUrl = imgUrl1;
      }

      // 4. Handle WordPress Publishing Pipeline
      const wpElement = document.getElementById('enable-wp');
      const doWP = wpElement ? wpElement.classList.contains('on') : true;

      if (doWP) {
        const site = getSite(row.website);
        if (site) {
          let mediaId = null;
          let finalPinUrlHtml = '';

          if (finalPinUrl) {
            log('  Uploading Placid Final Pin to WordPress Media Library...', 'info');
            const m = await uploadUrlToWP(finalPinUrl, row.title, site);
            mediaId = m ? m.id : null; 
            if (mediaId) {
              log('  ✓ Placid Pin attached as active Featured Image Thumbnail.', 'success');
            }
            
            // Render beautiful HTML content frame for the top of your post layout
            finalPinUrlHtml = `<div class="recipe-featured-image-wrapper" style="margin-bottom:30px; text-align:center;">
              <img src="${finalPinUrl}" alt="${row.title}" class="wp-post-image recipe-main-img" style="width:100%; max-width:800px; height:auto; border-radius:16px; box-shadow:0 4px 20px rgba(0,0,0,0.08);" />
            </div>`;
          }
          
          // Inject the image HTML directly where the AI created the hook token
          let contentWithImages = article.html || '';
          if (contentWithImages.includes('[TOP_FEATURED_IMAGE_PLACEHOLDER]')) {
            contentWithImages = contentWithImages.replace('[TOP_FEATURED_IMAGE_PLACEHOLDER]', finalPinUrlHtml);
          } else {
            contentWithImages = finalPinUrlHtml + contentWithImages;
          }

          const linkedArticle = { ...article, html: injectLinks(contentWithImages) };
          const wp = await publishPostWP(linkedArticle, mediaId, site);
          if (wp && wp.url) { 
            articleUrl = wp.url; 
            wpStatus = 'published'; 
            pubCount++; 
            log(`  ✓ Luxury Article Published: ${wp.url}`, 'success'); 
          }
        } else {
          log(`  ❌ Missing credentials configuration entry matching target profile: ${row.website}`, 'error');
        }
      }

      // 5. Append to Local Workboard State
      S.posts.push({
        title: row.title,
        imageUrl: finalPinUrl,
        board: row.board || 'Default',
        description: article.description || '',
        articleUrl: articleUrl,
        date: new Date().toISOString().split('T')[0],
        keywords: article.keywords || ''
      });

    } catch (rowErr) {
      log(`❌ Critical Pipeline Crash on Row ${i + 1}: ${rowErr.message}`, 'error');
    }

    // Refresh UI Preview panels dynamically
    updateUI();
  }

  log(`==================================================`, 'info');
  log(`🏁 Generation Cycle Complete! ${pubCount} posts deployed.`, 'success');
  if (typeof showToast === 'function') showToast(`Success! Generated ${pubCount} blog entries.`);
}

function injectLinks(html) {
  // Pass-through handler for inter-linking rules if matching datasets exist
  return html;
}

function updateUI() {
  const pubEl = document.getElementById('stat-published');
  const imgEl = document.getElementById('stat-images');
  if (pubEl) pubEl.textContent = S.posts.length;
  if (imgEl) imgEl.textContent = S.posts.filter(p => p.imageUrl).length;

  let html = '';
  S.posts.forEach((p, index) => {
    html += `<tr>
      <td>${index + 1}</td>
      <td><strong>${p.title}</strong></td>
      <td><span class="badge">${p.board}</span></td>
      <td><a href="${p.imageUrl}" target="_blank">View Pin Image</a></td>
      <td>${p.articleUrl ? `<a href="${p.articleUrl}" target="_blank" class="success-link">View Post Link</a>` : '<span style="color:var(--muted)">Skipped</span>'}</td>
    </tr>`;
  });
  
  const tbody = document.getElementById('preview-tbody');
  if (tbody && html) {
    tbody.innerHTML = html;
  }
}
