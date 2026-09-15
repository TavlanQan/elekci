// src/core/aliases.js
const fs = require('fs');
const path = require('path');

const ALIASES_PATH = path.resolve(__dirname, '../datasets/letter_aliases.json');

let cache = null;

function load() {
  if (cache) return cache;
  cache = JSON.parse(fs.readFileSync(ALIASES_PATH, 'utf8'));
  return cache;
}

function buildLookup(profile) {
  const data = load();
  const map = new Map();

  const addBlock = (block) => {
    if (!block) return;
    for (const [canonical, aliases] of Object.entries(block)) {
      for (const alias of aliases) {
        if (!alias || alias === canonical) continue;
        if (map.has(alias) && map.get(alias) !== canonical) {
          console.warn(
            `[aliases] конфликт: "${alias}" → "${map.get(alias)}" vs "${canonical}"`
          );
        }
        map.set(alias, canonical);
      }
    }
  };

  addBlock(data.global);
  if (profile && data[profile]) addBlock(data[profile]);

  // longest-match-first, чтобы "i\u0307" не разбивался на "i"
  return [...map.entries()].sort((a, b) => b[0].length - a[0].length);
}

function applyLookup(input, lookup) {
  let out = '';
  let i = 0;
  outer: while (i < input.length) {
    for (const [alias, canonical] of lookup) {
      if (input.startsWith(alias, i)) {
        out += canonical;
        i += alias.length;
        continue outer;
      }
    }
    out += input[i];
    i += 1;
  }
  return out;
}

/**
 * Мягкая нормализация: lowercase + NFC, без алиасов.
 * Используется до detectAlphabet/detectProfile.
 */
function softNormalize(word) {
  return String(word).toLowerCase().normalize('NFC');
}

/**
 * Полная нормализация:
 *   lowercase → NFC → global-алиасы → NFC → profile-алиасы → NFC
 * Возвращает каноническую форму — она идёт ключом в accepted/rejected.
 */
function normalizeWord(word, profile = null) {
  let w = String(word).toLowerCase().normalize('NFC');
  w = applyLookup(w, buildLookup(null));
  w = w.normalize('NFC');
  if (profile) {
    w = applyLookup(w, buildLookup(profile));
    w = w.normalize('NFC');
  }
  return w;
}

function _resetAliasCache() {
  cache = null;
}

module.exports = { normalizeWord, softNormalize, _resetAliasCache };