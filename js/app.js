const S = { rows: [], posts: [], lang: 'German', config: {} };

document.addEventListener('DOMContentLoaded', () => {
  loadConfig();

  const dz = document.getElementById('dropzone');
  const fi = document.getElementById('file-input');
  
  if (dz && fi) {
    dz.addEventListener('dragover', e => { e.preventDefault(); });
    dz.addEventListener('drop', e => { 
      e.preventDefault(); 
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); 
    });
    fi.addEventListener('change', () => { 
      if (fi.files[0]) handleFile(fi.files[0]); 
    });
  }
});