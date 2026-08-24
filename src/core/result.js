// src/core/result.js
/**
 * TÜRÜK SÖZLÜK ELETİVÇÜ
 * Core: standardized result object
 * License: GNU GPL v3
 * Author: Qandavır ulu Tavlan
 */

class ClassificationResult {
  constructor({ word, accepted, reasons = [], stage = null, profile = null, alphabet = null, features = {} }) {
    this.word = word || '';
    this.accepted = accepted;
    this.reasons = reasons;
    this.stage = stage;
    this.profile = profile;
    this.alphabet = alphabet;
    this.features = features;
  }

  toSimple(translations) {
    return this.accepted
      ? { correct: { [this.word]: translations } }
      : { incorrect: { [this.word]: translations } };
  }

  toDetailed(translations) {
    return this.accepted
      ? { correct: { [this.word]: { translations } } }
      : {
          incorrect: {
            [this.word]: {
              translations,
              reasons: this.reasons
            }
          }
        };
  }

  toAnalysis(translations) {
    return {
      word: this.word,
      translations,
      alphabet: this.alphabet,
      valid: this.accepted,
      score: null,
      reasons: this.reasons,
      features: this.features
    };
  }

  toJSON() {
    return {
      word: this.word,
      accepted: this.accepted,
      reasons: this.reasons,
      stage: this.stage,
      profile: this.profile,
      alphabet: this.alphabet,
      features: this.features
    };
  }
}

function createResult(word, accepted, reasons, profile, alphabet, features = {}) {
  return new ClassificationResult({
    word,
    accepted,
    reasons,
    profile,
    alphabet,
    features
  });
}

module.exports = { ClassificationResult, createResult };