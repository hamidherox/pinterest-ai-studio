function handleFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const data = new Uint8Array(e.target.result);
    const wb = XLSX.read(data, { type: 'array' });
    const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    S.rows = json.filter((r, i) => i > 0 && r[0]).map(r => ({
      title: (r[0] || '').toString().trim(),
      imgLink: (r[1] || '').toString().trim(),
      board: (r[2] || '').toString().trim(),
      website: (r[3] || '').toString().trim(),
    }));
    document.getElementById('file-name-display').textContent = `✓ Loaded ${S.rows.length} rows`;
    document.getElementById('stat-rows').textContent = S.rows.length;
    document.getElementById('start-date').value = new Date().toISOString().split('T')[0];
  };
  reader.readAsArrayBuffer(file);
}

function exportPinterest() {
  const header = ['Title', 'Media URL', 'Pinterest board', 'Thumbnail', 'Description', 'Link', 'Publish date', 'Keywords'];
  const rows = S.posts.map(p => [p.title, p.imageUrl, p.board, '', p.description, p.articleUrl, p.date, p.keywords || 'recipe, cooking']);
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pinterest');
  XLSX.writeFile(wb, `pinforge-export.xlsx`);
}

function clearAll() {
  S.rows = [];
  S.posts = [];
  document.getElementById('file-name-display').textContent = '';
  document.getElementById('stat-rows').textContent = 0;
  document.getElementById('stat-published').textContent = 0;
  document.getElementById('stat-images').textContent = 0;
  document.getElementById('preview-tbody').innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:32px;">Workspace Reset completed.</td></tr>';
  document.getElementById('img-grid-wrap').innerHTML = '<div style="text-align:center;color:var(--muted);padding:40px;grid-column:1/-1;">No imagery loaded.</div>';
}