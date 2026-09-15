// src/rules/consonants.js
/**
 * TÜRÜK SÖZLÜK ELETİVÇÜ
 * Rule: consonant run
 * License: GNU GPL v3
 * Author: Qandavır ulu Tavlan
 */

const { extractEffectiveVowels, CONSONANT_DIGRAPHS } = require('../core/alphabet');

/**
 * Проверяет, что в слове нет цепочек более чем из двух согласных подряд.
 * Учитывает:
 *  - глайды: 'у' после эффективной гласной считается согласной;
 *  - диграфы: 'гъ', 'къ' и т.п. считаются одной согласной.
 * @param {string} word
 * @param {string} profile
 * @returns {string|null}
 */
function checkConsonantRun(word, profile) {
  const effectiveVowels = extractEffectiveVowels(word, profile);
  const vowelPositions = new Set(effectiveVowels.map(v => v.index));
  const w = word.toLowerCase();

  let consonantCount = 0;
  let i = 0;

  while (i < w.length) {
    // Пробел — сброс и пропуск
    if (w[i] === ' ') {
      consonantCount = 0;
      i++;
      continue;
    }

    // Эффективная гласная — сброс и пропуск
    if (vowelPositions.has(i)) {
      consonantCount = 0;
      i++;
      continue;
    }

    // Проверяем диграф (только если не упёрлись в конец строки)
    if (i + 1 < w.length && CONSONANT_DIGRAPHS.has(w.slice(i, i + 2))) {
      consonantCount++;
      if (consonantCount > 2) return 'too_many_consonants';
      i += 2; // съедаем сразу два символа
      continue;
    }

    // Обычная одиночная согласная
    consonantCount++;
    if (consonantCount > 2) return 'too_many_consonants';
    i++;
  }

  return null;
}

module.exports = { checkConsonantRun };