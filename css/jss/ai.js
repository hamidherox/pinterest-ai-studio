async function generateArticle(title, website) {
  const provider = S.config.provider || 'pollinations-free';
  const apikey = (S.config.apikey || '').trim();
  const lang = S.lang;

  if (provider === 'template') return buildTemplate(title, website, lang);

  const systemMsg = `Write a comprehensive deep recipe food blog article in ${lang} language for the website "${website}" about "${title}". 
Provide step by step ingredient lists, directions, and optimized headings. You must reply strictly with a standard serialized JSON output object container containing 'html', 'description', 'keywords', and 'seoTitle' properties. Do not wrap inside codeblocks or markdown rules:
{
  "html": "<h2>Ingredients...</h2>",
  "description": "Short engaging description.",
  "keywords": "recipe, easy, cooking",
  "seoTitle": "${title}"
}`;

  try {
    if (provider === 'openai' && apikey) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apikey}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: systemMsg }] })
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
    log(`  ⚠ Custom AI format catch triggered. Loading adaptive localized layout matrix.`, 'warn');
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
  if (lang === 'French') {
    return {
      html: `<h2>Préparation de ${title}</h2><p>Bienvenue sur ${website}. Voici notre recette exclusive étape par étape pour réussir votre ${title} à la perfection.</p>`,
      description: `Découvrez la recette facile et rapide de ${title} sur ${website}.`,
      keywords: `${title}, recette, cuisine`,
      seoTitle: title
    };
  } else if (lang === 'Spanish') {
    return {
      html: `<h2>Preparación de ${title}</h2><p>Bienvenidos a ${website}. Aujourd'hui nous vous proposons une délicieuse recette de ${title}.</p>`,
      description: `Prueba esta receta deliciosa de ${title} en ${website}.`,
      keywords: `${title}, receta, cocinar`,
      seoTitle: title
    };
  } else if (lang === 'English') {
    return {
      html: `<h2>How to make ${title}</h2><p>Welcome back to ${website}. Today we are going to showcase the ultimate step-by-step guide to preparing an amazing ${title}.</p>`,
      description: `Learn how to cook the best ${title} recipe at ${website}.`,
      keywords: `${title}, recipe, cooking`,
      seoTitle: title
    };
  } else {
    return {
      html: `<h2>Zubereitung von ${title}</h2><p>Willkommen zurück auf ${website}. Heute präsentieren wir Ihnen ein fantastisches, einfaches Rezept für ${title}. Perfekt zubereitet, leicht verständlich und absolut köstlich.</p>`,
      description: `Das exklusive, leckere Rezept für ${title} auf ${website} ausprobieren.`,
      keywords: `${title}, Rezept, Kochen`,
      seoTitle: title
    };
  }
}
