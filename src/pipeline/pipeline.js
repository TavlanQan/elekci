// src/pipeline/pipeline.js
/**
 * TÜRÜK SÖZLÜK ELETİVÇÜ
 * Pipeline: process whole dictionary
 * License: GNU GPL v3
 * Author: Qandavır ulu Tavlan
 */

const { Classifier } = require('../core/classifier');

/**
 * Обрабатывает словарь (объект { слово: переводы }).
 * @param {Object} dictionary
 * @param {string} mode - 'simple' | 'detailed' | 'analysis'
 * @returns {Object} результат в соответствии с режимом
 */
function processDictionary(dictionary, mode = 'simple') {
  if (mode === 'simple') {
    const correct = {};
    const incorrect = {};
    for (const [word, translations] of Object.entries(dictionary)) {
      const result = Classifier.classify(word);
      if (result.accepted) {
        correct[word] = translations;
      } else {
        incorrect[word] = translations;
      }
    }
    return { correct, incorrect };
  }

  if (mode === 'detailed') {
    const correct = {};
    const incorrect = {};
    for (const [word, translations] of Object.entries(dictionary)) {
      const result = Classifier.classify(word);
      if (result.accepted) {
        correct[word] = { translations };
      } else {
        incorrect[word] = {
          translations,
          reasons: result.reasons
        };
      }
    }
    return { correct, incorrect };
  }

  if (mode === 'analysis') {
    const analysis = [];
    for (const [word, translations] of Object.entries(dictionary)) {
      const result = Classifier.classify(word);
      analysis.push({
        word,
        translations,
        alphabet: result.alphabet,
        valid: result.accepted,
        score: null,
        reasons: result.reasons,
        features: result.features
      });
    }
    return { analysis };
  }

  throw new Error(`Unknown mode: ${mode}`);
}

module.exports = { processDictionary };