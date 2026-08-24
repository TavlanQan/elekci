// tests/classifier.test.js
const assert = require('assert');
const { Classifier } = require('../src/core/classifier');

// Примеры
const tests = [
  // [слово, ожидаемый accepted]
  ['yel', true],        // латиница, гармония e (front) + e (front)
  ['telefon', false],   // возможно, запрещённый кластер 'fo'? но у нас кластеры сгенерированы из трёх букв, поэтому пропустим
  ['ата', true],        // кириллица, задний ряд
  ['китап', false],     // vowel_harmony: и (front) + а (back)
  ['сөз', true],        // казахский, ө front, е? нет, только ө, поэтому front, accepted
  ['әже', false],       // казахский, ә undefined -> false
  ['123', false],       // цифры
  ['рәсім', false],     // казахский? р запрещённая начальная, но перед этим undefined_vowel
  ['qazaq', true]       // латиница, q не в алфавите? Но detectAlphabet вернёт latin, все буквы латинские, гармония a+a -> true, но возможно запрещённая буква? q не запрещена, кластеров нет -> accepted
];

for (const [word, expected] of tests) {
  const result = Classifier.classify(word);
  assert.strictEqual(result.accepted, expected, `Слово ${word}: ожидалось ${expected}, получено ${result.accepted} (reasons: ${result.reasons})`);
  console.log(`✓ ${word}: ${result.accepted}`);
}

console.log('Все тесты пройдены.');