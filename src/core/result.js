// src/core/result.js
/**
 * TÜRÜK SÖZLÜK ELETİVÇÜ
 * Core: standardized result object
 * License: GNU GPL v3
 * Author: Qandavır ulu Tavlan
 *
 * ВАЖНО:
 *  - word            — оригинал, как его подал пользователь (может быть с İ, i̇ и т.п.)
 *  - softNormalized  — lowercase + NFC, без алиасов (промежуточный вариант)
 *  - normalized      — полная канонизация (lowercase + NFC + global-алиасы + profile-алиасы)
 *  - key             — то, что идёт ключом в accepted/rejected (= normalized)
 */

class ClassificationResult {
  constructor({
    word,
    accepted,
    reasons = [],
    stage = null,
    profile = null,
    alphabet = null,
    features = {},
    softNormalized = null,
    normalized = null
  }) {
    this.word = word || '';
    this.accepted = accepted;
    this.reasons = reasons;
    this.stage = stage;
    this.profile = profile;
    this.alphabet = alphabet;
    this.features = features;

    // Если нормализованные формы не пришли — падаем в оригинал,
    // чтобы код не сломался на старых вызовах.
    this.softNormalized = softNormalized != null ? softNormalized : this.word;
    this.normalized = normalized != null ? normalized : this.word;
  }

  /**
   * Ключ, под которым слово попадает в accepted/rejected.
   * Это ВСЕГДА каноническая форма, в нижнем регистре.
   */
  get key() {
    return this.normalized;
  }

  // ---------------------------------------------------------------
  // Формирование ответов. Обратите внимание: ключом везде идёт
  // this.key (то есть normalized), а не this.word.
  // ---------------------------------------------------------------

  toSimple(translations) {
    return this.accepted
      ? { correct: { [this.key]: translations } }
      : { incorrect: { [this.key]: translations } };
  }

  toDetailed(translations) {
    return this.accepted
      ? { correct: { [this.key]: { translations } } }
      : {
          incorrect: {
            [this.key]: {
              translations,
              reasons: this.reasons
            }
          }
        };
  }

  /**
   * В analysis отдаём ОБА варианта:
   *  - word            — что подали на вход
   *  - softNormalized  — lowercase+NFC (промежуточный шаг)
   *  - normalized      — итоговая каноническая форма (то, что ушло в правила)
   */
  toAnalysis(translations) {
    return {
      word: this.word,
      softNormalized: this.softNormalized,
      normalized: this.normalized,
      translations,
      alphabet: this.alphabet,
      profile: this.profile,
      valid: this.accepted,
      score: null,
      reasons: this.reasons,
      features: this.features
    };
  }

  toJSON() {
    return {
      word: this.word,
      softNormalized: this.softNormalized,
      normalized: this.normalized,
      accepted: this.accepted,
      reasons: this.reasons,
      stage: this.stage,
      profile: this.profile,
      alphabet: this.alphabet,
      features: this.features
    };
  }
}

/**
 * Фабрика результата.
 *
 * Порядок аргументов СОХРАНЁН для обратной совместимости:
 *   (word, accepted, reasons, profile, alphabet, features, softNormalized, normalized)
 *
 * Последние два — новые. Если их не передать, поля словно равны word.
 */
function createResult(
  word,
  accepted,
  reasons,
  profile,
  alphabet,
  features = {},
  softNormalized = null,
  normalized = null
) {
  return new ClassificationResult({
    word,
    accepted,
    reasons,
    profile,
    alphabet,
    features,
    softNormalized,
    normalized
  });
}

module.exports = { ClassificationResult, createResult };