// server.js
require('dotenv').config();
const express = require('express');
const multer  = require('multer');
const { TurkicRules } = require('./rules');

const upload = multer({ storage: multer.memoryStorage() });
const app = express();
const PORT = process.env.PORT || 3000;

// Раздача статических файлов из public/
app.use(express.static('public'));

// Обработка POST-запроса с JSON-файлами
app.post('/process', upload.array('dictionaries'), (req, res) => {
  const correct   = {};
  const incorrect = {};

  for (const file of req.files) {
    try {
      const data = JSON.parse(file.buffer.toString('utf8'));
      Object.entries(data).forEach(([word, translations]) => {
        if (!word) return;
        // Определение алфавита
        const alphabet = detectAlphabet(word);
        if (['mixed_alphabets','invalid_digits','unknown'].includes(alphabet)) {
          incorrect[word] = { translations, reason: alphabet };
        } else {
          const [ok, reason] = TurkicRules.isTurkic(word, alphabet);
          ok ? correct[word] = translations : incorrect[word] = { translations, reason };
        }
      });
    } catch (e) {
      // Некорректный JSON-файл пропускаем
    }
  }

  res.json({ correct, incorrect });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

// Функция detectAlphabet здесь же:
function detectAlphabet(word) {
  const w = word.toLowerCase();
  if (/[0-9]/.test(w)) return 'invalid_digits';
  const cyr = /[а-яёөүғқңһәəіэ]/;
  const lat = /[a-z]/;
  const hasC = cyr.test(w);
  const hasL = lat.test(w);
  if (hasC && hasL) return 'mixed_alphabets';
  if (hasL) return 'latin';
  if (hasC) return 'cyrillic';
  return 'unknown';
}
