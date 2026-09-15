// src/core/alphabet.js
/**
 * TÜRÜK SÖZLÜK ELETİVÇÜ
 * Core: alphabet and profile detection
 * License: GNU GPL v3
 * Author: Qandavır ulu Tavlan
 */

const PROFILES = {
  latin: {
    name: 'latin',
    vowels: {
      back: ['a', 'o', 'u', 'ı'],
      front: ['e', 'ö', 'ü', 'i']
    },
    forbiddenExtraVowels: ['â', 'ä', 'ə'],
    specificLetters: new Set(['ö', 'ü', 'ç', 'ş', 'ğ', 'ı', 'ə'])
  },
  cyrillic: {
    name: 'cyrillic',
    vowels: {
      back: ['а', 'о', 'у', 'ы'],
      front: ['е', 'ё', 'ю', 'и']
    },
    forbiddenExtraVowels: ['â', 'э', 'я'],
    specificLetters: new Set(['ө', 'ү', 'ғ', 'қ', 'ң', 'ә', 'і'])
  },
  kazakh: {
    name: 'kazakh',
    vowels: {
      back: ['а', 'о', 'у', 'ы'],
      front: ['е', 'ө', 'ү', 'і']
    },
    undefinedVowels: ['ә', 'ұ'],
    specificLetters: new Set(['ә', 'ө', 'ү', 'ң', 'ғ', 'қ', 'і', 'ұ'])
  }
};

// Множества для однозначного определения алфавита
const LATIN_BASE = new Set(
  'abcdefghijklmnopqrstuvwxyz'.split('')
);

const CYRILLIC_BASE = new Set(
  'абвгдежзийклмнопрстуфхцчшщъыьэюяё'.split('')
);

// Специфические латинские буквы (входят в латиницу, но не в базовый a-z)
const LATIN_SPECIFIC = new Set([
  'ö', 'ü', 'ç', 'ş', 'ğ', 'ı', 'ə'
]);

// Специфические кириллические буквы (входят в кириллицу, но не в базовый русский)
const CYRILLIC_SPECIFIC = new Set([
  'ә', 'ө', 'ү', 'ң', 'ғ', 'қ', 'і', 'ұ'
]);

const CONSONANT_DIGRAPHS = new Set(['гъ', 'къ']);

/**
 * Определяет алфавит по большинству букв.
 * @param {string} word
 * @returns {'latin'|'cyrillic'|'mixed_alphabets'|'invalid_digits'|'unknown'}
 */
function detectAlphabet(word) {
  const w = word.toLowerCase();
  if (/[0-9]/.test(w)) return 'invalid_digits';

  let latinCount = 0;
  let cyrillicCount = 0;

  for (const ch of w) {
    if (LATIN_BASE.has(ch) || LATIN_SPECIFIC.has(ch)) {
      latinCount++;
    }
    if (CYRILLIC_BASE.has(ch) || CYRILLIC_SPECIFIC.has(ch)) {
      cyrillicCount++;
    }
  }

  if (latinCount === 0 && cyrillicCount === 0) {
    return 'unknown';
  }

  if (latinCount > cyrillicCount) {
    return 'latin';
  }

  if (cyrillicCount > latinCount) {
    return 'cyrillic';
  }

  // Если количество одинаково, но есть хотя бы одна специфическая буква,
  // склоняемся к алфавиту, которому она принадлежит
  const hasLatinSpecific = [...w].some(ch => LATIN_SPECIFIC.has(ch));
  const hasCyrillicSpecific = [...w].some(ch => CYRILLIC_SPECIFIC.has(ch));

  if (hasLatinSpecific && !hasCyrillicSpecific) return 'latin';
  if (hasCyrillicSpecific && !hasLatinSpecific) return 'cyrillic';

  // Если всё ещё неясно, считаем mixed
  return 'mixed_alphabets';
}

/**
 * Определяет профиль на основе алфавита и наличия казахских спецбукв.
 * @param {string} word
 * @returns {'latin'|'cyrillic'|'kazakh'|'mixed_alphabets'|'invalid_digits'|'unknown'}
 */
function detectProfile(word) {
  const alphabet = detectAlphabet(word);
  if (alphabet === 'cyrillic') {
    // Казахский профиль, только если есть специфические казахские буквы
    const kazakhSpecific = ['ә', 'ө', 'ү', 'ұ', 'ң', 'ғ', 'қ', 'і'];
    const w = word.toLowerCase();
    if (kazakhSpecific.some(ch => w.includes(ch))) {
      return 'kazakh';
    }
    return 'cyrillic';
  }
  if (alphabet === 'latin') {
    return 'latin';
  }
  return alphabet; // mixed_alphabets, invalid_digits, unknown
}

function getVowelSets(profile) {
  const p = PROFILES[profile];
  if (!p) return null;
  return p.vowels;
}

function getUndefinedVowels(profile) {
  const p = PROFILES[profile];
  return p?.undefinedVowels || [];
}

/**
 * Возвращает массив эффективных гласных в слове с учётом контекста.
 * В тюркских кириллических профилях (cyrillic, kazakh) буква 'у'
 * считается глайдом (согласной), если непосредственно перед ней
 * стоит уже принятая эффективная гласная. Это даёт чередование
 * гл-согл-гл-согл в сериях вида "уууу".
 * @param {string} word
 * @param {string} profile
 * @returns {Array<{ch: string, index: number}>}
 */
function extractEffectiveVowels(word, profile) {
  const vowelSets = getVowelSets(profile);
  if (!vowelSets) return [];

  const w = word.toLowerCase();
  const undefinedVowels = getUndefinedVowels(profile) || [];
  const allVowels = new Set([
    ...vowelSets.back,
    ...vowelSets.front,
    ...undefinedVowels
  ]);

  const result = [];
  for (let i = 0; i < w.length; i++) {
    const ch = w[i];
    if (!allVowels.has(ch)) continue;

    // 'у' — глайд, если непосредственно перед ней стоит
    // уже принятая эффективная гласная (result[last].index === i - 1).
    if (
      (profile === 'cyrillic' || profile === 'kazakh') &&
      ch === 'у' &&
      result.length > 0 &&
      result[result.length - 1].index === i - 1
    ) {
      continue;
    }

    result.push({ ch, index: i });
  }
  return result;
}

module.exports = {
  PROFILES,
  detectAlphabet,
  detectProfile,
  getVowelSets,
  getUndefinedVowels,
  extractEffectiveVowels,
  CONSONANT_DIGRAPHS,
  LATIN_BASE,
  LATIN_SPECIFIC,
  CYRILLIC_BASE,
  CYRILLIC_SPECIFIC
};