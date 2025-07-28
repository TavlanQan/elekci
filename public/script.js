// script.js
document.getElementById('process').addEventListener('click', async () => {
  const input = document.getElementById('files');
  if (!input.files.length) {
    alert('Выберите хотя бы один JSON-файл');
    return;
  }

  const form = new FormData();
  Array.from(input.files).forEach(file => form.append('dictionaries', file));

  const res = await fetch('/process', { method: 'POST', body: form });
  const { correct, incorrect } = await res.json();

  // Создание и скачивание файлов
  downloadJSON(correct, 'correct.json');
  downloadJSON(incorrect, 'incorrect.json');
});

function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 4)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
