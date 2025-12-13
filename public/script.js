document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById('files');
  const dropArea = document.getElementById('drop-area');
  const fileList = document.getElementById('file-list');
  const processBtn = document.getElementById('process');
  const downloadLinks = document.getElementById('download-links');

  // Обработка drag & drop
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

  function highlight() {
    dropArea.classList.add('dragover');
  }

  function unhighlight() {
    dropArea.classList.remove('dragover');
  }

  dropArea.addEventListener('drop', handleDrop, false);

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    fileInput.files = files;
    updateFileList();
  }

  // Обновление списка файлов
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
          <button class="remove-file" data-index="${index}">
            <i class="fas fa-times"></i>
          </button>
        `;
        fileList.appendChild(fileItem);
      });

      // Добавляем обработчики для кнопок удаления
      document.querySelectorAll('.remove-file').forEach(btn => {
        btn.addEventListener('click', function() {
          const index = parseInt(this.getAttribute('data-index'));
          removeFile(index);
        });
      });
    }
  }

  function removeFile(index) {
    const dt = new DataTransfer();
    const files = Array.from(fileInput.files);
    
    files.splice(index, 1);
    
    files.forEach(file => {
      dt.items.add(file);
    });
    
    fileInput.files = dt.files;
    updateFileList();
  }

  // Обработка нажатия кнопки
  processBtn.addEventListener('click', async () => {
    const input = document.getElementById('files');
    if (!input.files.length) {
      alert('EM AZI BILA BIR JSON SALIŞNI SAJLA');
      return;
    }

    // Блокируем кнопку на время обработки
    processBtn.disabled = true;
    processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Обработка...</span>';

    try {
      const form = new FormData();
      Array.from(input.files).forEach(file => form.append('dictionaries', file));

      const res = await fetch('/process', { method: 'POST', body: form });
      const { correct, incorrect } = await res.json();

      // Показываем результаты
      showResults(correct, incorrect);
    } catch (error) {
      console.error('Error:', error);
      alert('Произошла ошибка при обработке файлов');
    } finally {
      // Разблокируем кнопку
      processBtn.disabled = false;
      processBtn.innerHTML = '<i class="fas fa-cogs"></i><span>ELERGE (Обработать)</span>';
    }
  });

  function showResults(correct, incorrect) {
    downloadLinks.innerHTML = '';
    
    // Карточка для правильных слов
    if (correct) {
      const correctCard = document.createElement('div');
      correctCard.className = 'result-card correct';
      correctCard.innerHTML = `
        <h3><i class="fas fa-check-circle"></i> KIRSIZ (Правильные)</h3>
        <p>Слова, прошедшие проверку правил</p>
        <p><strong>Записей:</strong> ${Object.keys(correct).length}</p>
        <button class="download-btn" onclick='downloadJSON(${JSON.stringify(correct)}, "kirsiz.json")'>
          <i class="fas fa-download"></i>
          Скачать kirsiz.json
        </button>
      `;
      downloadLinks.appendChild(correctCard);
    }
    
    // Карточка для неправильных слов
    if (incorrect) {
      const incorrectCard = document.createElement('div');
      incorrectCard.className = 'result-card incorrect';
      incorrectCard.innerHTML = `
        <h3><i class="fas fa-exclamation-circle"></i> KIRME (Неправильные)</h3>
        <p>Слова, не соответствующие правилам</p>
        <p><strong>Записей:</strong> ${Object.keys(incorrect).length}</p>
        <button class="download-btn" onclick='downloadJSON(${JSON.stringify(incorrect)}, "kirme.json")'>
          <i class="fas fa-download"></i>
          Скачать kirme.json
        </button>
      `;
      downloadLinks.appendChild(incorrectCard);
    }
  }

  // Глобальная функция для скачивания
  window.downloadJSON = function(obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 4)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Показываем уведомление о скачивании
    showNotification(`Файл ${filename} скачивается`);
  };

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
    
    notification.innerHTML = `
      <i class="fas fa-check-circle"></i>
      ${message}
    `;
    
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