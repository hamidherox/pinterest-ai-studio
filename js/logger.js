function log(msg, type = 'info') {
  const box = document.getElementById('log-box');
  if (!box) return;
  const div = document.createElement('div');
  div.className = 'log-line ' + type;
  div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function setProgress(pct, label) {
  const wrap = document.getElementById('progress-wrap');
  const bar = document.getElementById('progress-bar');
  const lbl = document.getElementById('progress-label');
  if (wrap) wrap.style.display = 'block';
  if (bar) bar.style.width = pct + '%';
  if (lbl) lbl.textContent = label;
}