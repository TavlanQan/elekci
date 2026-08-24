// src/rules/consonants.js
const { getVowelSets, getUndefinedVowels } = require('../core/alphabet');

function checkConsonantRun(word, profile) {
  const vowelSets = getVowelSets(profile);
  if (!vowelSets) return null;

  const undefinedVowels = getUndefinedVowels(profile) || [];
  const vowels = new Set([
    ...vowelSets.back,
    ...vowelSets.front,
    ...undefinedVowels
  ]);

  const w = word.toLowerCase();
  let consonantCount = 0;

  for (const ch of w) {
    if (ch === ' ') {
      consonantCount = 0;
      continue;
    }
    if (vowels.has(ch)) {
      consonantCount = 0;
    } else {
      consonantCount++;
      if (consonantCount > 2) {
        return 'too_many_consonants';
      }
    }
  }
  return null;
}

module.exports = { checkConsonantRun };