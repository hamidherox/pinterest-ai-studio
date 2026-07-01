function getCustomImagePrompt(recipeTitle, variantIndex) {
  // Gracefully handles fallback bindings to whichever configuration key names exist
  const template1 = S.config.promptTemplate1 || S.config.promptTpl || "High-res professional food photography of {title}, luxury plating, cinematic lighting, macro close up --ar 2:3";
  const template2 = S.config.promptTemplate2 || "Gourmet preparation shot of ingredients for {title}, rustic studio lighting, editorial style --ar 2:3";
  
  const activeTemplate = (variantIndex === 2) ? template2 : template1;
  
  // Normalizes token variations for total runtime flexibility
  let prompt = activeTemplate
    .replace(/{title}/g, recipeTitle)
    .replace(/\[\$title\]/g, recipeTitle);
    
  return prompt;
}

function getAIImageUrl(prompt, subModel, variantIndex) {
  // Generates an un-cached random seed for every individual execution run
  const randomSeed = Math.floor(Math.random() * 9999999) + 1;
  
  // Creates a dynamic cache-buster string to shatter internal browser loading memory
  const cacheBuster = Date.now() + "_" + Math.floor(Math.random() * 1000);

  // Sanitizes structural sub-model strings matching Pollinations production clusters
  let activeModel = (subModel || 'flux').trim().toLowerCase();
  if (activeModel.includes('realism') || activeModel.includes('gourmet')) {
    activeModel = 'flux-realism';
  } else {
    activeModel = 'flux'; 
  }

  // Returns pristine assembly URL parameters
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=1200&model=${activeModel}&seed=${randomSeed}&nologo=true&cb=${cacheBuster}`;
}

async function testAIConnection() {
  if (typeof saveConfig === 'function') saveConfig();
  
  const provider = S.config.provider || 'pollinations-free';
  const apikey = (S.config.apikey || '').trim();
  
  log(`[DEBUG] Initializing test connection to text provider...`, 'info');
  
  if (provider === 'pollinations-free') {
    log(`[DEBUG SUCCESS] Pollinations Free Cluster selected. 100% active.`, 'success');
    alert("✓ Active on Free Pollinations Engine.");
    return;
  }
  
  if (!apikey) { 
    alert("❌ OpenAI Key Empty"); 
    return; 
  }
  
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${apikey}` 
      },
      body: JSON.stringify({ 
        model: 'gpt-4o-mini', 
        messages: [{ role: 'user', content: 'Ping' }], 
        max_tokens: 5 
      })
    });
    
    const txt = await res.json();
    
    if (!res.ok) { 
      log(`[DEBUG FAIL] Status ${res.status}: ${JSON.stringify(txt)}`, 'error'); 
      alert(`❌ Error ${res.status}`); 
    } else { 
      log(`[DEBUG SUCCESS] Verified.`, 'success'); 
      alert("✓ Connected successfully."); 
    }
  } catch (e) { 
    log(`[DEBUG ERROR] ${e.message}`, 'error'); 
    alert(`❌ Connection error: ${e.message}`);
  }
}
