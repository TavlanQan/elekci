document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById('files');
  const dropArea = document.getElementById('drop-area');
  const fileList = document.getElementById('file-list');
  const processBtn = document.getElementById('process');
  const downloadLinks = document.getElementById('download-links');
  const modeSelect = document.getElementById('mode');

  // ===== Drag & Drop =====
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
  });

  function highlight() { dropArea.classList.add('dragover'); }
  function unhighlight() { dropArea.classList.remove('dragover'); }

  dropArea.addEventListener('drop', handleDrop, false);
  function handleDrop(e) {
    const dt = e.dataTransfer;
    fileInput.files = dt.files;
    updateFileList();
  }

  fileInput.addEventListener('change', updateFileList);

  function updateFileList() {
    fileList.innerHTML = '';
    if (fileInput.files.length > 0) {
      Array.from(fileInput.files).forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
          <div>
            <i class="fas fa-file-code"></i>
            <span>${file.name}</span>
            <small>(${(file.size / 1024).toFixed(2)} KB)</small>
          </div>
        `;
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-file';
        removeBtn.setAttribute('data-index', index);
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.addEventListener('click', function() {
          removeFile(parseInt(this.getAttribute('data-index')));
        });
        fileItem.appendChild(removeBtn);
        fileList.appendChild(fileItem);
      });
    }
  }

  function removeFile(index) {
    const dt = new DataTransfer();
    const files = Array.from(fileInput.files);
    files.splice(index, 1);
    files.forEach(file => dt.items.add(file));
    fileInput.files = dt.files;
    updateFileList();
  }

  // ===== Обработка =====
  processBtn.addEventListener('click', async () => {
    if (!fileInput.files.length) {
      alert('EM AZI BILA BIR JSON SALIŞNI SAJLA');
      return;
    }

    processBtn.disabled = true;
    processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Обработка...</span>';

    try {
      const form = new FormData();
      Array.from(fileInput.files).forEach(file => form.append('dictionaries', file));
      form.append('mode', modeSelect.value);

      const res = await fetch('/process', { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Сервер вернул ${res.status}`);
      const data = await res.json();

      renderResults(data, modeSelect.value);
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Произошла ошибка при обработке файлов');
    } finally {
      processBtn.disabled = false;
      processBtn.innerHTML = '<i class="fas fa-cogs"></i><span>ELERGE (Обработать)</span>';
    }
  });

  // ===== Отображение результатов =====
  function renderResults(data, mode) {
    downloadLinks.innerHTML = '';

    if (mode === 'analysis') {
      if (!data.analysis || !data.analysis.length) {
        showPlaceholder('Нет данных для отображения');
        return;
      }
      const card = document.createElement('div');
      card.className = 'result-card analysis';
      const total = data.analysis.length;
      const valid = data.analysis.filter(item => item.valid).length;
      const invalid = total - valid;
      card.innerHTML = `
        <h3><i class="fas fa-chart-bar"></i> Результаты анализа</h3>
        <p>Всего слов: ${total}, Принято: ${valid}, Отклонено: ${invalid}</p>
      `;
      const btn = document.createElement('button');
      btn.className = 'download-btn';
      btn.innerHTML = '<i class="fas fa-download"></i> Скачать analysis.json';
      btn.addEventListener('click', () => downloadJSON(data, 'analysis.json'));
      card.appendChild(btn);
      downloadLinks.appendChild(card);
      return;
    }

    // simple / detailed
    const correct = data.correct || {};
    const incorrect = data.incorrect || {};

    if (Object.keys(correct).length) {
      downloadLinks.appendChild(
        createResultCard('correct', 'KIRSIZ (Правильные)', 'Слова, прошедшие проверку правил', correct, 'accepted.json')
      );
    }

    if (Object.keys(incorrect).length) {
      downloadLinks.appendChild(
        createResultCard('incorrect', 'KIRME (Неправильные)', 'Слова, не соответствующие правилам', incorrect, 'rejected.json')
      );
    }

    if (!Object.keys(correct).length && !Object.keys(incorrect).length) {
      showPlaceholder('Нет данных для отображения');
    }
  }

  function createResultCard(type, title, subtitle, data, filename) {
    const card = document.createElement('div');
    card.className = `result-card ${type}`;
    card.innerHTML = `
      <h3><i class="fas ${type === 'correct' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${title}</h3>
      <p>${subtitle}</p>
      <p><strong>Записей:</strong> ${Object.keys(data).length}</p>
    `;
    const btn = document.createElement('button');
    btn.className = 'download-btn';
    btn.innerHTML = `<i class="fas fa-download"></i> Скачать ${filename}`;
    btn.addEventListener('click', () => downloadJSON(data, filename));
    card.appendChild(btn);
    return card;
  }

  function showPlaceholder(message) {
    const placeholder = document.createElement('div');
    placeholder.className = 'result-card placeholder';
    placeholder.innerHTML = `<i class="fas fa-info-circle"></i><p>${message}</p>`;
    downloadLinks.appendChild(placeholder);
  }

  // ===== Скачивание =====
  function downloadJSON(obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 4)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    showNotification(`Файл ${filename} скачивается`);
  }

  function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #27ae60;
      color: white;
      padding: 15px 25px;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  }

  // Добавляем стили для анимации уведомления
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
});