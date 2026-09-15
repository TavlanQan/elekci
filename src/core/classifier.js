// src/core/classifier.js
const { detectAlphabet, detectProfile } = require('./alphabet');
const { createResult } = require('./result');
const { normalizeWord, softNormalize } = require('./aliases');

const { checkStarts } = require('../rules/starts');
const {
  checkForbiddenLetters,
  checkSymbols,
  checkUnsupportedLetters
} = require('../rules/letters');
const { checkClusters } = require('../rules/clusters');
const { checkVowelHarmony } = require('../rules/harmony');
const { checkConsonantRun } = require('../rules/consonants');
const { checkVowelSequence } = require('../rules/vowel_sequence');

class Classifier {
  /**
   * Классифицирует одно слово.
   *
   * Порядок нормализации:
   *   1. softNormalize  — lowercase + NFC (нужно для detectAlphabet/detectProfile)
   *   2. detectAlphabet
   *   3. detectProfile
   *   4. normalizeWord  — lowercase + NFC + global-алиасы + profile-алиасы
   *   5. все правила работают на канонической форме
   *
   * @param {string} word
   * @returns {ClassificationResult}
   */
  static classify(word) {
    const originalWord = String(word);

    // 1) Мягкая нормализация: нижний регистр + NFC.
    const soft = softNormalize(originalWord);

    // 2) Определяем алфавит.
    const alphabet = detectAlphabet(soft);

    // 3) Ранний выход при недопустимом алфавите.
    if (['mixed_alphabets', 'invalid_digits', 'unknown'].includes(alphabet)) {
      const fallback = normalizeWord(originalWord, null);
      return createResult(
        originalWord, false, [alphabet], null, alphabet, {},
        soft, fallback
      );
    }

    // 4) Определяем профиль (до профильных алиасов).
    const profile = detectProfile(soft);

    // 5) Полная нормализация — канонический ключ.
    const normalized = normalizeWord(originalWord, profile);

    // 6) Проверка длины уже по нормализованной форме
    //    (например, "İ" → soft "i̇" длины 2, но normalized "i" длины 1).
    if (normalized.length < 2) {
      return createResult(
        originalWord, false, ['single_character'], profile, alphabet, {},
        soft, normalized
      );
    }

    const reasons = [];

    // Запрещённые символы (цифры, пунктуация)
    const symReason = checkSymbols(normalized);
    if (symReason) reasons.push(symReason);

    // Нераспознанные символы (вне LATIN_BASE/SPECIFIC и CYRILLIC_BASE/SPECIFIC)
    const unsupportedReason = checkUnsupportedLetters(normalized);
    if (unsupportedReason) reasons.push(unsupportedReason);

    // Запрещённые буквы
    const lettersReason = checkForbiddenLetters(normalized, profile);
    if (lettersReason) reasons.push(lettersReason);

    // Запрещённая начальная буква
    const startsReason = checkStarts(normalized, profile);
    if (startsReason) reasons.push(startsReason);

    // Запрещённые кластеры
    const clustersReason = checkClusters(normalized, profile);
    if (clustersReason) reasons.push(clustersReason);

    // Гармония гласных
    const harmonyReason = checkVowelHarmony(normalized, profile);
    if (harmonyReason) reasons.push(harmonyReason);

    // Порядок гласных в обоих рядах
    const vowelSequenceReason = checkVowelSequence(normalized, profile);
    if (vowelSequenceReason) reasons.push(vowelSequenceReason);

    // Слишком длинная последовательность согласных
    const consonantRunReason = checkConsonantRun(normalized, profile);
    if (consonantRunReason) reasons.push(consonantRunReason);

    const accepted = reasons.length === 0;

    // Для будущих признаков — пока пустой объект
    const features = {};

    return createResult(
      originalWord, accepted, reasons, profile, alphabet, features,
      soft, normalized
    );
  }
}

module.exports = { Classifier };