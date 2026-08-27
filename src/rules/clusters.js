// src/rules/clusters.js
/**
 * TÜRÜK SÖZLÜK ELETİVÇÜ
 * Rule: forbidden clusters
 * License: GNU GPL v3
 * Author: Qandavır ulu Tavlan
 */

const fs = require('fs');
const path = require('path');

// Загружаем кластеры один раз при старте
const cyrClusters = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../datasets/forbidden_clusters_cyr.json'), 'utf8')
);
const latClusters = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../datasets/forbidden_clusters_lat.json'), 'utf8')
);

const qazClusters = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../datasets/forbidden_clusters_qaz.json'), 'utf8')
);

const clusterSets = {
  latin: latClusters,
  cyrillic: cyrClusters,
  kazakh: qazClusters
};

console.log(`[DEBUG] Latin clusters loaded: ${latClusters.length}`);
console.log(`[DEBUG] Cyrillic clusters loaded: ${cyrClusters.length}`);
console.log(`[DEBUG] Qazaq clusters loaded: ${qazClusters.length}`);

/**
 * Проверяет, содержит ли слово запрещённый кластер.
 * @param {string} word
 * @param {string} profile
 * @returns {string|null}
 */
function checkClusters(word, profile) {
  const clusters = clusterSets[profile];
  if (!clusters) return null;
  const w = word.toLowerCase();
  const found = clusters.some(cl => w.includes(cl));
  if (found) {
    return 'forbidden_cluster';
  }
  return null;
}

module.exports = { checkClusters };