// src/pipeline/pipeline.js
/**
 * TÜRÜK SÖZLÜK ELETİVÇÜ
 * Pipeline: process whole dictionary
 * License: GNU GPL v3
 * Author: Qandavır ulu Tavlan
 *
 * ВАЖНО:
 *  - Ключом в accepted/rejected идёт result.key —
 *    это нормализованная форма в нижнем регистре (см. result.js).
 *  - Если два разных написания дают один и тот же ключ
 *    (например, "İlgi" и "ilgi"), их translations ОБЪЕДИНЯЮТСЯ.
 *  - analysis использует result.toAnalysis(), который отдаёт
 *    оригинал, softNormalized и normalized.
 */

const { Classifier } = require('../core/classifier');

/**
 * Добавляет переводы в существующую запись, не создавая дубликатов.
 * @param {Array} target - массив переводов, который накапливаем
 * @param {Array} source - массив переводов, которые добавляем
 */
function mergeTranslations(target, source) {
  if (!Array.isArray(source)) return;
  for (const t of source) {
    if (!target.includes(t)) target.push(t);
  }
}

/**
 * Обрабатывает словарь (объект { слово: переводы }).
 *
 * @param {Object} dictionary - { "слово": ["перевод1", "перевод2"] }
 * @param {string} mode - 'simple' | 'detailed' | 'analysis'
 * @returns {Object} результат в соответствии с режимом
 */
function processDictionary(dictionary, mode = 'simple') {
  // -----------------------------------------------------------------
  // simple: { correct: { key: [translations] }, incorrect: { key: [translations] } }
  // -----------------------------------------------------------------
  if (mode === 'simple') {
    const correct = {};
    const incorrect = {};

    for (const [word, translations] of Object.entries(dictionary)) {
      const result = Classifier.classify(word);
      const key = result.key; // ← нормализованный ключ, не оригинал

      const bucket = result.accepted ? correct : incorrect;

      // Если ключ уже есть — объединяем переводы, а не затираем.
      if (!bucket[key]) bucket[key] = [];
      mergeTranslations(bucket[key], translations);
    }

    return { correct, incorrect };
  }

  // -----------------------------------------------------------------
  // detailed: к incorrect добавляется поле reasons
  // -----------------------------------------------------------------
  if (mode === 'detailed') {
    const correct = {};
    const incorrect = {};

    for (const [word, translations] of Object.entries(dictionary)) {
      const result = Classifier.classify(word);
      const key = result.key;

      if (result.accepted) {
        if (!correct[key]) correct[key] = { translations: [] };
        mergeTranslations(correct[key].translations, translations);
      } else {
        if (!incorrect[key]) {
          incorrect[key] = {
            translations: [],
            reasons: result.reasons
          };
        }
        mergeTranslations(incorrect[key].translations, translations);
        // reasons оставляем от первой встречи; если хочешь объединять —
        // можно сделать что-то вроде:
        //   for (const r of result.reasons)
        //     if (!incorrect[key].reasons.includes(r))
        //       incorrect[key].reasons.push(r);
      }
    }

    return { correct, incorrect };
  }

  // -----------------------------------------------------------------
  // analysis: массив объектов, по одному на КАЖДОЕ вхождение слова.
  //   Здесь коллизии НЕ объединяем — важно видеть каждое исходное
  //   написание отдельно.
  // -----------------------------------------------------------------
  if (mode === 'analysis') {
    const analysis = [];

    for (const [word, translations] of Object.entries(dictionary)) {
      const result = Classifier.classify(word);
      // result.toAnalysis(translations) отдаёт:
      //   word, softNormalized, normalized, translations,
      //   alphabet, profile, valid, score, reasons, features
      analysis.push(result.toAnalysis(translations));
    }

    return { analysis };
  }

  throw new Error(`Unknown mode: ${mode}`);
}

module.exports = { processDictionary };