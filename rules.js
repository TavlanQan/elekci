// rules.js
require('dotenv').config();
const fs   = require('fs');
const path = require('path');

const ENV_CLUSTERS = {
  cyrillic: process.env.FORBIDDEN_CLUSTERS_CYRILLIC
    ? process.env.FORBIDDEN_CLUSTERS_CYRILLIC.split(',').map(s => s.trim())
    : [],
  latin: process.env.FORBIDDEN_CLUSTERS_LATIN
    ? process.env.FORBIDDEN_CLUSTERS_LATIN.split(',').map(s => s.trim())
    : []
};

class TurkicRules {
  static FORBIDDEN_STARTS = {
    cyrillic: ['р','л','н','м','ф','ц','щ','â'],
    latin:    ['r','l','n','f','m','ə','â','w','x','ä']
  };

  static FORBIDDEN_LETTERS = {
    cyrillic: ['ф','ц','щ','ь','-'],
    latin:    ['f','w','x','-']
  };

  static FORBIDDEN_CLUSTERS = ENV_CLUSTERS;

  static FORBIDDEN_SYMBOLS = [
    "'", "(", ")", "[", "]", "{", "}", "!", "@", "#", "$", "%",
    "^", "&", "*", "+", "=", "0","1","2","3","4","5","6","7","8","9",
    ".", "`", "/"
  ];

  static checkConsonantClusters(word, alphabet) {
    const vowels = {
      cyrillic: ['а','е','ё','и','і','о','у','ы','э','ю','я','ө','ү','ә'],
      latin:    ['a','e','i','o','u','ı','ï','ö','ü','ä','î','ê','â']
    }[alphabet];

    const allowedClusters = {
      cyrillic: [
        'рт','рд','лт','нч','нт','қс','қы','қа','қо','қу','ға','ғо','ғу',
        'сі','iс','зi','қш','ққ','ұқ','рақ','рәк','рқ','рғ','рх','рһ',
        'лқ','лғ','нқ','нғ','ақ','оқ','із'
      ],
      latin: [
        'rt','rd','lt','nç','nt','qs','qı','qa','qo','qu','ğa','ğo','ğu',
        'qş','qq','uq','raq','rək','rq','rğ','rx','rh','lq','lğ','nq','nğ'
      ]
    }[alphabet];

    let consonantCount = 0;
    const w = word.toLowerCase();
    let i = 0;

    while (i < w.length) {
      const ch = w[i];
      if (ch === ' ') {
        consonantCount = 0;
        i++;
        continue;
      }

      // öter tizekle
      let found = false;
      for (const cl of allowedClusters) {
        if (w.slice(i, i + cl.length) === cl) {
          i += cl.length;
          consonantCount = 0;
          found = true;
          break;
        }
      }
      if (found) continue;

      if (vowels.includes(ch)) {
        consonantCount = 0;
      } else {
        consonantCount++;
        if (consonantCount > 2) {
          // ajrı üçlü tizekle
          const three = w.slice(i - 2, i + 1);
          const special3 = {
            cyrillic: ['ұққ','ққы','ққа','ққұ','ққс','рақ','рәк','лқы','нқы','құт'],
            latin:    ['uqq','qqı','qqa','qqu','qqs','raq','rək','lqı','nqı','qut','ngl']
          }[alphabet];

          if (special3.includes(three)) {
            consonantCount = 0;
            i++;
            continue;
          }
          return false;
        }
      }
      i++;
    }

    return true;
  }

  static _findConsonantUCyrillic(word) {
    const positions = new Set();
    const w = word.toLowerCase();
    const regex = /[аеёиіоөүыэюя]у/g;
    let m;

    while ((m = regex.exec(w)) !== null) {
      positions.add(m.index + 1);
    }
    if (w.startsWith('у') && w.length > 1) {
      const nxt = w[1];
      if (['а','е','ё','и','і','о','ө','ү','ы','э'].includes(nxt)) {
        positions.add(0);
      }
    }
    return positions;
  }

  static checkVowelHarmony(word, alphabet) {
    const parts = word.split(' ').filter(p => p.length);
    for (const part of parts) {
      const sets = alphabet === 'cyrillic'
        ? {
            back:    ['а','ы','о','у'],
            front:   ['е','и','і','ө','ү','ё','ю'],
            neutral: ['э','ю','я'],
            consU:   this._findConsonantUCyrillic(part)
          }
        : {
            back:    ['a','ı','ï','o','u'],
            front:   ['e','i','ö','ü','ä','î','ê'],
            neutral: ['â'],
            consU:   new Set()
          };

      const used = [];
      const w = part.toLowerCase();
      for (let i = 0; i < w.length; i++) {
        const c = w[i];
        if ([...sets.back, ...sets.front, ...sets.neutral].includes(c)) {
          if (alphabet === 'cyrillic' && c === 'у' && sets.consU.has(i)) {
            continue;
          }
          used.push(c);
        }
      }

      if (used.some(v => sets.neutral.includes(v))) {
        return false;
      }

      const usedSet = new Set(used);
      const mixedAllowed = new Set(['a','ı','ï']);
      const hasFront = [...usedSet].some(v => sets.front.includes(v));
      const hasBack  = [...usedSet].some(
        v => sets.back.includes(v) && !mixedAllowed.has(v)
      );

      if (hasFront && hasBack) {
        return false;
      }
    }

    return true;
  }

  static checkClusters(word, alphabet) {
    const w = word.toLowerCase();
    return !this.FORBIDDEN_CLUSTERS[alphabet].some(cl => w.includes(cl));
  }

  static checkSymbols(word) {
    return !this.FORBIDDEN_SYMBOLS.some(sym => word.includes(sym));
  }

  static hasForbiddenLetters(word, alphabet) {
    const w = word.toLowerCase();
    if (w.includes('ə') || (alphabet === 'cyrillic' && w.includes('ә'))) {
      return true;
    }
    return this.FORBIDDEN_LETTERS[alphabet].some(l => w.includes(l));
  }

  static isTurkic(word, alphabet) {
    if (word.length < 2) {
      return [false, 'single_character'];
    }
    if (!this.checkSymbols(word)) {
      return [false, 'forbidden_symbols_or_digits'];
    }
    if (this.hasForbiddenLetters(word, alphabet)) {
      return [false, 'forbidden_letters'];
    }

    const first = word[0].toLowerCase();
    if (this.FORBIDDEN_STARTS[alphabet].includes(first)) {
      return [false, `forbidden_start: ${first}`];
    }
    if (!this.checkClusters(word, alphabet)) {
      return [false, 'forbidden_cluster'];
    }
    if (!this.checkVowelHarmony(word, alphabet)) {
      return [false, 'vowel_harmony'];
    }
    if (!this.checkConsonantClusters(word, alphabet)) {
      return [false, 'too_many_consonants'];
    }

    return [true, 'valid'];
  }
}

// cazıvın ajıradı
function detectAlphabet(word) {
  const w = word.toLowerCase();
  if (/[0-9]/.test(w)) return 'invalid_digits';

  const cyrBase = /[а-яёөүғқңһәəіэ]/;
  const latBase = /[a-z]/;
  const cyrSpec = new Set(['ә','ө','ү','ң','ғ','қ','һ','ə','і','э']);
  const latSpec = new Set(['ö','ü','ə','ç','ş','ğ','ı','ï','â','ä','î','ê']);

  const hasCyr = cyrBase.test(w);
  const hasLat = latBase.test(w);
  const chars  = new Set(w.split(''));
  const hasCyrSpec = [...chars].some(c => cyrSpec.has(c));
  const hasLatSpec = [...chars].some(c => latSpec.has(c));

  if (hasCyrSpec)       return 'cyrillic';
  if (hasLatSpec)       return 'latin';
  if (hasCyr && hasLat) return 'mixed_alphabets';
  if (hasLat)           return 'latin';
  if (hasCyr)           return 'cyrillic';
  return 'unknown';
}

// bar salışlanı oqub cetekin cazadı
function processFiles() {
  const correct   = {};
  const incorrect = {};
  const allFiles  = fs.readdirSync('.');

  for (const fname of allFiles) {
    if (!fname.endsWith('.json')) continue;
    if (['correct.json','incorrect.json'].includes(fname)) continue;

    let data;
    try {
      data = JSON.parse(fs.readFileSync(fname, 'utf8'));
    } catch {
      continue;
    }

    for (const [word, translations] of Object.entries(data)) {
      if (!word) continue;
      const alphabet = detectAlphabet(word);

      if (['mixed_alphabets','invalid_digits','unknown'].includes(alphabet)) {
        incorrect[word] = { translations, reason: alphabet };
      } else {
        const [ok, reason] = TurkicRules.isTurkic(word, alphabet);
        if (ok) {
          correct[word] = translations;
        } else {
          incorrect[word] = { translations, reason };
        }
      }
    }
  }

  const outDir = path.join('.', 'output');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outDir, 'cuyre.json'),
    JSON.stringify(correct, null, 4),
    'utf8'
  );
  fs.writeFileSync(
    path.join(outDir, 'tuvra.json'),
    JSON.stringify(incorrect, null, 4),
    'utf8'
  );

  console.log(`Bitkeni mında ${outDir}/`);
  console.log(`✔ tuvrası: ${Object.keys(correct).length}`);
  console.log(`✖ çüyresi: ${Object.keys(incorrect).length}`);
}

if (require.main === module) {
  processFiles();
}

module.exports = {
  TurkicRules,
  detectAlphabet,
  processFiles
};

