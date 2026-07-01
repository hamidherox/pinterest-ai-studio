async function generateArticle(title, website) {
  const provider = S.config.provider || 'pollinations-free';
  const apikey = (S.config.apikey || '').trim();
  const lang = S.lang;

  if (provider === 'template') return buildTemplate(title, website, lang);

  const systemMsg = `You are a world-class Michelin star chef and culinary writer contributing an elite article to "${website}" in ${lang} language. 
Your single objective is to write the ultimate "Luxury Recipe" guide for making "${title}", engineered to eliminate all ambiguity in the cooking process.

Follow these strict Reddit Recipe Architecture rules:
1. TARGET SELECTION (Luxury Recipe Mode): You must include all possible premium ingredients, specialized pairings, and master-level techniques to craft a visually stunning, incredibly aromatic, and flawless version of "${title}".
2. MULTI-MEASUREMENT INGREDIENTS (4 Servings): Avoid vague terms like "milk" or "fish". Specify exact animal source, fat percentages, and cuts. For every single ingredient, you MUST provide the quantity using THREE simultaneous measurement methods: Weight (Grams/Kilograms), Volume (Milliliters/Liters), and specific Household Units (e.g., standard level 240ml cups, level 15ml tablespoons, or 5ml teaspoons).
3. EQUIPMENT PROFILE: Explicitly state the exact kitchen hardware, pan types (e.g., heavy-bottomed stainless steel, seasoned cast iron), and heat settings required before starting.
4. CHRONOLOGICAL DIRECTIONS & PRECISE TIMERS: Write a clear, numbered list for steps. Every single step MUST contain a precise time duration (in minutes or seconds). If an item is added "gradually", define exactly how (e.g., "Pour the olive oil in a slow, steady stream over exactly 45 seconds while whisking constantly").
5. SCIENCE TIPS & SUBSTITUTIONS: Include contextual "Chef's Notes" explaining the culinary science behind crucial steps (e.g., why a temperature matters) and provide 2-3 precise ingredient substitutions for dietary flexibility without ruining the balance.
6. THEME STYLING HOOK: At the absolute beginning of your 'html' content string, you MUST place this exact image placeholder tag: [TOP_FEATURED_IMAGE_PLACEHOLDER]

Return ONLY a valid, raw JSON object matching this exact schema. Do not include markdown codeblocks (such as \`\`\`json):
{
  "html": "<h1>Gourmet Guide to Perfect ${title}</h1><p>...</p><h2>Required Kitchen Equipment</h2>...<h2>Ultra-Precise Multi-Measurement Ingredients</h2>...<h2>Chronological Step-by-Step Instructions</h2>...",
  "description": "An elite, completely unambiguous luxury masterclass recipe guide to preparing the perfect ${title}.",
  "keywords": "${title} recipe, luxury cooking, gourmet guide, masterclass recipe",
  "seoTitle": "The Perfect ${title} Recipe (Ultra-Precise Luxury Guide)"
}`;

  try {
    if (provider === 'openai' && apikey) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apikey}` },
        body: JSON.stringify({ 
          model: 'gpt-4o-mini', 
          messages: [{ role: 'system', content: systemMsg }],
          temperature: 0.3 
        })
      });
      const text = await res.json();
      let content = text.choices?.[0]?.message?.content || '';
      content = cleanJsonString(content);
      return JSON.parse(content);
    }
    
    const pResp = await fetch(`https://text.pollinations.ai/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: systemMsg }], model: 'mistral' })
    });
    let pText = await pResp.text();
    pText = cleanJsonString(pText);
    return JSON.parse(pText);
  } catch (err) {
    log(`  ⚠ AI processing fallback triggered. Loading standard safety matrix.`, 'warn');
    return buildTemplate(title, website, lang);
  }
}

function cleanJsonString(str) {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
  cleaned = cleaned.trim();
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }
  return cleaned;
}

function buildTemplate(title, website, lang) {
  return {
    html: `[TOP_FEATURED_IMAGE_PLACEHOLDER]<h2>Luxury Preparation: ${title}</h2><p>Welcome to ${website}. This is our premium guide to crafting the perfect ${title}.</p>`,
    description: `Learn how to make the perfect ${title} on ${website}.`,
    keywords: `${title}, recipe, luxury`,
    seoTitle: title
  };
}
