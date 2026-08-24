/**
 * TÜRÜK SÖZLÜK ELETİVÇÜ
 * Rule: vowel sequence (допустимые переходы между гласными)
 * License: GNU GPL v3
 * Author: Qandavır ulu Tavlan
 */

const { getVowelSets, getUndefinedVowels } = require('../core/alphabet');

/**
 * Возвращает допустимые переходы для заднего и переднего ряда
 * в зависимости от профиля.
 */
function getAllowedTransitions(profile) {
  switch (profile) {
    case 'latin':
      return {
        back: {
          a: new Set(['a', 'ı']),
          o: new Set(['u', 'a', 'ı']),
          u: new Set(['u', 'a', 'ı']),
          ı: new Set(['ı', 'a'])
        },
        front: {
          e: new Set(['e', 'i']),
          ö: new Set(['ü', 'e', 'i']),
          ü: new Set(['ü', 'e', 'i']),
          i: new Set(['i', 'e'])
        }
      };
    case 'cyrillic':
      return {
        back: {
          а: new Set(['а', 'ы']),
          о: new Set(['у', 'а', 'ы']),
          у: new Set(['у', 'а', 'ы']),
          ы: new Set(['ы', 'а'])
        },
        front: {
          е: new Set(['е', 'и']),
          ё: new Set(['ю', 'е', 'и']),
          ю: new Set(['ю', 'е', 'и']),
          и: new Set(['и', 'е'])
        }
      };
    case 'kazakh':
      return {
        back: {
          а: new Set(['а', 'ы']),
          о: new Set(['у', 'а', 'ы']),
          у: new Set(['у', 'а', 'ы']),
          ы: new Set(['ы', 'а'])
        },
        front: {
          е: new Set(['е', 'і']),
          ө: new Set(['ү', 'е', 'і']),
          ү: new Set(['ү', 'е', 'і']),
          і: new Set(['і', 'е'])
        }
      };
    default:
      return null;
  }
}

/**
 * Проверяет последовательность гласных в слове.
 * @param {string} word
 * @param {string} profile
 * @returns {string|null}
 */
function checkVowelSequence(word, profile) {
  const vowelSets = getVowelSets(profile);
  if (!vowelSets) return null;

  // Если есть неопределённые гласные, слово уже будет отклонено
  const undefinedVowels = getUndefinedVowels(profile) || [];
  const w = word.toLowerCase();
  if (undefinedVowels.some(v => w.includes(v))) {
    return null;
  }

  const transitions = getAllowedTransitions(profile);
  if (!transitions) return null;

  const back = vowelSets.back;
  const front = vowelSets.front;

  // Извлекаем последовательность гласных, игнорируя согласные
  const vowelsInWord = [];
  for (const ch of w) {
    if (back.includes(ch) || front.includes(ch)) {
      vowelsInWord.push(ch);
    }
  }

  // Если гласных меньше двух, правило не применимо
  if (vowelsInWord.length < 2) return null;

  // Проверяем каждую соседнюю пару
  for (let i = 0; i < vowelsInWord.length - 1; i++) {
    const current = vowelsInWord[i];
    const next = vowelsInWord[i + 1];

    // Определяем, к какому ряду принадлежит текущая гласная
    const isBackCurrent = back.includes(current);
    const allowedSet = isBackCurrent ? transitions.back[current] : transitions.front[current];

    if (!allowedSet || !allowedSet.has(next)) {
      return 'invalid_vowel_sequence';
    }
  }

  return null;
}

module.exports = { checkVowelSequence };