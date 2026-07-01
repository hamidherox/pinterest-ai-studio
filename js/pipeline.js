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

      // 2. Generate Dual Visual Prompts via Pollinations
      const prompt1 = `food photography, ${row.title}::1, tilt shift, branding composition, high detail, steakhouse, professional magazine ad.

To create this ultra-realistic and mouth-watering image, we recommend using a full-frame DSLR camera with a macro lens to capture the intricate details of the dish.

For the best results, set the camera to manual mode and adjust the following settings:

ISO: 100-200 to minimize noise and maintain image quality
Aperture: f/2.8
Shutter Speed: 1/160
White Balance: Daylight

Lighting is key in food photography. Use natural light if possible. If shooting indoors, use a softbox or diffuser.

--ar 3:2 --v 4`;
      const prompt2 = `Gourmet preparation shot of ingredients for ${row.title}, rustic studio lighting, editorial style --ar 2:3`;

      const imgUrl1 = getAIImageUrl(prompt1, 'flux', 1);
      const imgUrl2 = getAIImageUrl(prompt2, 'flux', 2);
      log(`  Generated twin creative asset targets.`, 'info');

      // 3. Connect to Placid Composite Canvas Engine
      try {
        log('  Sending variant images to Placid Studio...', 'info');
        finalPinUrl = await generatePlacidComposite(row.title, imgUrl1, imgUrl2);
        log('  ✓ Placid high-resolution multi-layer pin generated!', 'success');
      } catch (placidErr) {
        log(`  ❌ Placid layout compilation failed: ${placidErr.message}. Defaulting to Image 1 route.`, 'warn');
        finalPinUrl = imgUrl1;
      }

      // 4. Handle WordPress Publishing Pipeline
      // FIXED: Bulletproof layout element checker to prevent 'null' pointer exceptions
      const wpElement = document.getElementById('enable-wp');
      const doWP = wpElement ? wpElement.checked : true;

      if (doWP) {
        const site = getSite(row.website);
        if (site) {
          let mediaId = null;
          let finalPinUrlHtml = '';

          if (finalPinUrl) {
            log('  Uploading Placid Final Pin to WordPress Media Library...', 'info');
            const m = await uploadUrlToWP(finalPinUrl, row.title, site);
            mediaId = m.id; 
            if (mediaId) {
              log('  ✓ Placid Pin attached as active Featured Image Thumbnail.', 'success');
            }
            
            // Render beautiful HTML content frame for the top of your post layout
            finalPinUrlHtml = `<div class="recipe-featured-image-wrapper" style="margin-bottom:30px; text-align:center;">
              <img src="${finalPinUrl}" alt="${row.title}" class="wp-post-image recipe-main-img" style="width:100%; max-width:800px; height:auto; border-radius:16px; box-shadow:0 4px 20px rgba(0,0,0,0.08);" />
            </div>`;
          }
          
          // Inject the image HTML directly where the AI created the hook token
          let contentWithImages = article.html;
          if (contentWithImages.includes('[TOP_FEATURED_IMAGE_PLACEHOLDER]')) {
            contentWithImages = contentWithImages.replace('[TOP_FEATURED_IMAGE_PLACEHOLDER]', finalPinUrlHtml);
          } else {
            contentWithImages = finalPinUrlHtml + contentWithImages;
          }

          const linkedArticle = { ...article, html: injectLinks(contentWithImages) };
          const wp = await publishPostWP(linkedArticle, mediaId, site);
          if (wp.url) { 
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
        board: row.board,
        description: article.description,
        articleUrl: articleUrl,
        date: new Date().toISOString().split('T')[0],
        keywords: article.keywords
      });

    } catch (rowErr) {
      log(`❌ Critical Pipeline Crash on Row ${i + 1}: ${rowErr.message}`, 'error');
    }

    // Refresh UI Preview panels dynamically
    updateUI();
  }

  log(`==================================================`, 'info');
  log(`🏁 Generation Cycle Complete! ${pubCount} posts deployed.`, 'success');
  showToast(`Success! Generated ${pubCount} blog entries.`);
}

function injectLinks(html) {
  // Pass-through handler for inter-linking rules if matching datasets exist
  return html;
}

function updateUI() {
  document.getElementById('stat-published').textContent = S.posts.length;
  document.getElementById('stat-images').textContent = S.posts.filter(p => p.imageUrl).length;

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
  
  if(html) {
    document.getElementById('preview-tbody').innerHTML = html;
  }
}
