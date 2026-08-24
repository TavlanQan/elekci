// src/rules/letters.js
/**
 * TÜRÜK SÖZLÜK ELETİVÇÜ
 * Rule: forbidden letters and symbols
 * License: GNU GPL v3
 * Author: Qandavır ulu Tavlan
 */

const forbiddenLetters = require('../datasets/forbidden_letters.json');
const {
  LATIN_BASE,
  LATIN_SPECIFIC,
  CYRILLIC_BASE,
  CYRILLIC_SPECIFIC
} = require('../core/alphabet');

// Общие запрещённые символы (цифры, пунктуация и пр.)
const FORBIDDEN_SYMBOLS = [
  "'", "(", ")", "[", "]", "{", "}", "!", "@", "#", "$", "%",
  "^", "&", "*", "+", "=", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  ".", "`", "/"
];

/**
 * Проверяет, что все символы слова (кроме пробелов) принадлежат
 * известным алфавитным наборам латиницы или кириллицы.
 * @param {string} word
 * @returns {string|null}
 */
function checkUnsupportedLetters(word) {
  const w = word.toLowerCase();
  for (const ch of w) {
    if (ch === ' ') continue;
    if (
      LATIN_BASE.has(ch) ||
      LATIN_SPECIFIC.has(ch) ||
      CYRILLIC_BASE.has(ch) ||
      CYRILLIC_SPECIFIC.has(ch)
    ) {
      continue;
    }
    return 'unsupported_letter';
  }
  return null;
}

/**
 * Проверяет запрещённые буквы в слове.
 * @param {string} word
 * @param {string} profile
 * @returns {string|null}
 */
function checkForbiddenLetters(word, profile) {
  const list = forbiddenLetters[profile] || [];
  const w = word.toLowerCase();
  if (list.some(l => w.includes(l))) {
    return 'forbidden_letters';
  }
  return null;
}

/**
 * Проверяет запрещённые символы и цифры.
 * @param {string} word
 * @returns {string|null}
 */
function checkSymbols(word) {
  if (FORBIDDEN_SYMBOLS.some(sym => word.includes(sym))) {
    return 'forbidden_symbols_or_digits';
  }
  return null;
}

module.exports = {
  checkForbiddenLetters,
  checkSymbols,
  checkUnsupportedLetters
};