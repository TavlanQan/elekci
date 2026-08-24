// src/core/classifier.js
/**
 * TÜRÜK SÖZLÜK ELETİVÇÜ
 * Core: deterministic classifier
 * License: GNU GPL v3
 * Author: Qandavır ulu Tavlan
 */

const { detectAlphabet, detectProfile } = require('./alphabet');
const { createResult } = require('./result');
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
   * @param {string} word
   * @returns {ClassificationResult}
   */
  static classify(word) {
    const alphabet = detectAlphabet(word);

    // Если алфавит недопустим, сразу возвращаем ошибку
    if (['mixed_alphabets', 'invalid_digits', 'unknown'].includes(alphabet)) {
      return createResult(word, false, [alphabet], null, alphabet, {});
    }

    if (word.length < 2) {
      return createResult(word, false, ['single_character'], null, alphabet, {});
    }

    const profile = detectProfile(word);
    const reasons = [];

    // Проверка запрещённых символов (цифры, пунктуация)
    const symReason = checkSymbols(word);
    if (symReason) reasons.push(symReason);

    // Проверка на наличие нераспознанных символов
    const unsupportedReason = checkUnsupportedLetters(word);
    if (unsupportedReason) reasons.push(unsupportedReason);

    // Запрещённые буквы
    const lettersReason = checkForbiddenLetters(word, profile);
    if (lettersReason) reasons.push(lettersReason);

    // Запрещённая начальная буква
    const startsReason = checkStarts(word, profile);
    if (startsReason) reasons.push(startsReason);

    // Запрещённые кластеры
    const clustersReason = checkClusters(word, profile);
    if (clustersReason) reasons.push(clustersReason);

    // Гармония гласных
    const harmonyReason = checkVowelHarmony(word, profile);
    if (harmonyReason) reasons.push(harmonyReason);

    // Порядок гласных в обоих рядах
    const vowelSequenceReason = checkVowelSequence(word, profile);
    if (vowelSequenceReason) reasons.push(vowelSequenceReason);


    // Слишком длинная последовательность согласных
    const consonantRunReason = checkConsonantRun(word, profile);
    if (consonantRunReason) reasons.push(consonantRunReason);

    const accepted = reasons.length === 0;

    // Для будущих признаков — пока пустой объект
    const features = {};

    return createResult(word, accepted, reasons, profile, alphabet, features);
  }
}

module.exports = { Classifier };