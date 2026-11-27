import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const cache = new Map(), storage = new Map();
const wx = { getStorageSync: key => storage.get(key), setStorageSync: (key, value) => storage.set(key, structuredClone(value)) };
function load(file) {
  const resolved = path.resolve(file);
  if (cache.has(resolved)) return cache.get(resolved).exports;
  const module = { exports: {} }; cache.set(resolved, module);
  const source = fs.readFileSync(resolved, 'utf8');
  const require = spec => load(path.resolve(path.dirname(resolved), spec));
  vm.runInNewContext(`(function(require,module,exports,wx){${source}\n})`, {}, { filename: resolved })(require, module, module.exports, wx);
  return module.exports;
}
const parser = load('wechat-mini/utils/parser.js');
const store = load('wechat-mini/utils/store.js');
assert.equal(store.get().items.length, 709);
assert.equal(store.get().queue.length, 50);
const words = parser.parseText('Delegate | 代表\nnew-pavilion | 新亭阁\n');
assert.equal(words.length, 2);
assert.equal(store.importWords(words).added, 1);
assert.equal(store.get().items.length, 710);
const id = store.get().queue[0];
store.mark(id, 'remembered', true);
assert.equal(store.get().todayCompleted, 1);
assert.equal(store.get().index, 1);
for (let i = 1; i < 50; i++) store.move(1);
assert.equal(store.get().index, 50);
store.nextBatch();
assert.equal(store.get().queue.length, 50);
assert.equal(store.get().todayCompleted, 1);
assert(!store.get().queue.includes(id));
assert.equal(store.lastSevenDays().length, 7);
console.log('WeChat vocabulary, import, daily batches and history passed.');
