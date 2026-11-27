const builtIn = require('../data/vocab.js');
const KEY = 'jaja-geneva-mini-v1';
let state;
function dateKey(d) { const x = d || new Date(); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; }
function fresh() { return { items: builtIn.map(w => ({ ...w })), daily: [], date: '', queue: [], index: 0, outcomes: {}, todaySeen: [], todayCompleted: 0, batch: 0 }; }
function save() { wx.setStorageSync(KEY, state); }
function load() {
  if (state) return state;
  try { state = wx.getStorageSync(KEY) || fresh(); } catch (_) { state = fresh(); }
  if (!Array.isArray(state.items) || !Array.isArray(state.daily) || !Array.isArray(state.queue)) state = fresh();
  const existing = new Set(state.items.map(w => w.id));
  builtIn.forEach(w => { if (!existing.has(w.id)) state.items.push({ ...w }); });
  ensureDaily(); return state;
}
function shuffle(input) { const a = input.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function nextBatch() {
  const used = new Set(state.todaySeen || []), rank = { forgotten: 0, new: 1, remembered: 2 };
  const sorted = a => a.sort((x, y) => (rank[x.status] || 0) - (rank[y.status] || 0));
  const pool = sorted(state.items.filter(w => !used.has(w.id)));
  const rest = sorted(state.items.filter(w => used.has(w.id)));
  state.queue = shuffle(pool.concat(rest).slice(0, 50).map(w => w.id));
  state.index = 0; state.outcomes = {}; state.batch = (state.batch || 0) + 1; save();
}
function ensureDaily() {
  if (state.date === dateKey()) { state.todaySeen = state.todaySeen || []; state.todayCompleted = state.todayCompleted || 0; return; }
  state.date = dateKey(); state.todaySeen = []; state.todayCompleted = 0; state.batch = 0; nextBatch();
}
function get() { load(); ensureDaily(); return state; }
function word(id) { return get().items.find(w => w.id === id); }
function mark(id, status, daily) {
  const s = get(), w = word(id); if (!w || !['remembered', 'forgotten'].includes(status)) return;
  w.status = status; w.updatedAt = new Date().toISOString();
  let entry = s.daily.find(d => d.date === dateKey());
  if (!entry) { entry = { date: dateKey(), studied: 0, remembered: 0, forgotten: 0 }; s.daily.push(entry); }
  entry[status]++; entry.studied++; s.daily = s.daily.slice(-365); s.outcomes[id] = status;
  if (daily) { if (!s.todaySeen.includes(id)) s.todaySeen.push(id); s.todayCompleted++; s.index++; }
  save();
}
function move(step) {
  const s = get();
  if (step > 0) { const id = s.queue[s.index]; if (id && !s.todaySeen.includes(id)) s.todaySeen.push(id); }
  s.index = Math.min(s.queue.length, Math.max(0, s.index + step)); save();
}
function restart() { const s = get(); s.queue = shuffle(s.queue); s.index = 0; s.outcomes = {}; save(); }
function importWords(words) {
  const s = get(), seen = new Set(s.items.map(w => w.text.trim().toLowerCase())); let added = 0;
  words.forEach(w => { const key = String(w.text || '').trim().toLowerCase(); if (!key || seen.has(key)) return; seen.add(key); s.items.push({ ...w, id: `u${Date.now()}-${added}`, status: 'new', collection: '我的词库' }); added++; });
  save(); return { added, skipped: words.length - added };
}
function lastSevenDays() {
  const s = get(); return Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return s.daily.find(row => row.date === dateKey(d)) || { date: dateKey(d), studied: 0, remembered: 0, forgotten: 0 }; });
}
function resetProgress() { const s = get(); s.items.forEach(w => { w.status = 'new'; }); s.daily = []; s.date = ''; ensureDaily(); save(); }
function replace(backup) {
  if (!backup || !Array.isArray(backup.items) || !Array.isArray(backup.daily) || !Array.isArray(backup.queue) || typeof backup.date !== 'string' || !backup.outcomes || typeof backup.outcomes !== 'object') throw Error('备份格式不正确');
  const ids = new Set(); backup.items.forEach(w => { if (typeof w.id !== 'string' || ids.has(w.id) || typeof w.text !== 'string' || !['new', 'remembered', 'forgotten'].includes(w.status)) throw Error('词条格式不正确'); ids.add(w.id); });
  if (backup.queue.some(id => !ids.has(id))) throw Error('练习队列格式不正确');
  state = backup; ensureDaily(); save();
}
module.exports = { get, word, mark, move, nextBatch: () => { get(); nextBatch(); }, restart, importWords, lastSevenDays, resetProgress, replace, dateKey };
