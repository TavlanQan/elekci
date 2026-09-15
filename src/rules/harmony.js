// src/rules/harmony.js
/**
 * TÜRÜK SÖZLÜK ELETİVÇÜ
 * Rule: vowel harmony
 * License: GNU GPL v3
 * Author: Qandavır ulu Tavlan
 */

const { getVowelSets, getUndefinedVowels, extractEffectiveVowels } = require('../core/alphabet');

/**
 * Проверяет сингармонизм.
 * @param {string} word
 * @param {string} profile
 * @returns {string|null}
 */
function checkVowelHarmony(word, profile) {
  const vowelSets = getVowelSets(profile);
  if (!vowelSets) return null;

  const undefinedVowels = getUndefinedVowels(profile) || [];
  const w = word.toLowerCase();

  // Если в слове есть неопределённые гласные (ә, ұ в казахском профиле)
  if (undefinedVowels.some(v => w.includes(v))) {
    return 'undefined_vowel';
  }

  const back = vowelSets.back;
  const front = vowelSets.front;
  const used = extractEffectiveVowels(word, profile)
    .filter(v => back.includes(v.ch) || front.includes(v.ch))
    .map(v => v.ch);

  // Если гласных нет — правило не нарушено (слово будет обработано другими правилами)
  if (used.length === 0) return null;

  const hasFront = used.some(v => front.includes(v));
  const hasBack = used.some(v => back.includes(v));

  if (hasFront && hasBack) {
    return 'vowel_harmony';
  }

  return null;
}

module.exports = { checkVowelHarmony };