// src/server/server.js
/**
 * TÜRÜK SÖZLÜK ELETİVÇÜ
 * Server: Express + multer
 * License: GNU GPL v3
 * Author: Qandavır ulu Tavlan
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const { processDictionary } = require('../pipeline/pipeline');

const upload = multer({ storage: multer.memoryStorage() });
const app = express();
const PORT = process.env.PORT || 3000;

// Раздача статики из public/
app.use(express.static(path.join(__dirname, '../../public')));

app.post('/process', upload.array('dictionaries'), (req, res) => {
  if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

  const mode = req.body.mode || 'simple';
  const allEntries = {};

  // Собираем все записи из загруженных JSON-файлов
  for (const file of req.files) {
    try {
      const data = JSON.parse(file.buffer.toString('utf8'));
      Object.assign(allEntries, data);
    } catch (e) {
      // Некорректный JSON пропускаем
    }
  }

try {
  const output = processDictionary(allEntries, mode);
  res.json(output);
} catch (err) {
  res.status(400).json({ error: err.message });
}

});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});