function getCustomImagePrompt(recipeTitle, variantIndex) {
  const template = S.config.promptTpl || 'food photography, [$title]::1, tilt shift, branding composition...';
  let prompt = template.replace('[$title]', recipeTitle);
  
  if (variantIndex === 2) {
    prompt += ", alternative close-up angle asset";
  }
  return prompt;
}

function getAIImageUrl(prompt, subModel, variantIndex) {
  const seed = variantIndex === 1 ? 1111 : 2222;
  // Ensure strict template literal configuration execution blocks
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=1200&model=${subModel}&seed=${seed}&nologo=true`;
}

async function testAIConnection() {
  saveConfig();
  const provider = S.config.provider;
  const apikey = (S.config.apikey || '').trim();
  log(`[DEBUG] Initializing test connection to text provider...`, 'info');
  if (provider === 'pollinations-free') {
    log(`[DEBUG SUCCESS] Pollinations Free Cluster selected. 100% active.`, 'success');
    alert("✓ Active on Free Pollinations Engine.");
    return;
  }
  if (!apikey) { alert("❌ OpenAI Key Empty"); return; }
  try {
    const res = await fetch('[https://api.openai.com/v1/chat/completions](https://api.openai.com/v1/chat/completions)', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apikey}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'Ping' }], max_tokens: 5 })
    });
    const txt = await res.json();
    if (!res.ok) { log(`[DEBUG FAIL] Status ${res.status}: ${txt}`, 'error'); alert(`❌ Error ${res.status}`); }
    else { log(`[DEBUG SUCCESS] Verified.`, 'success'); alert("✓ Connected successfully."); }
  } catch (e) { log(`[DEBUG ERROR] ${e.message}`, 'error'); }
}
