// src/rules/starts.js
/**
 * TÜRÜK SÖZLÜK ELETİVÇÜ
 * Rule: forbidden initial letters
 * License: GNU GPL v3
 * Author: Qandavır ulu Tavlan
 */

const forbiddenStarts = require('../datasets/forbidden_starts.json');

/**
 * Проверяет запрещённую начальную букву.
 * @param {string} word
 * @param {string} profile - 'latin' | 'cyrillic' | 'kazakh'
 * @returns {string|null} причина отказа или null
 */
function checkStarts(word, profile) {
  const list = forbiddenStarts[profile] || [];
  const first = word[0].toLowerCase();
  if (list.includes(first)) {
    return `forbidden_start: ${first}`;
  }
  return null;
}

module.exports = { checkStarts };