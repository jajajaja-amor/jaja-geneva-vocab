function parseText(text) {
  const items = [];
  let current = null;
  const labels = { '中文': 'translation', '释义': 'translation', '词根': 'roots', '词根词缀': 'roots', '拓展': 'extension', '解释': 'extension', '例句': 'example', '英文例句': 'example', '例句翻译': 'exampleZh', '中文例句': 'exampleZh', '音标': 'phonetic' };
  String(text || '').split(/\r?\n/).forEach(raw => {
    let line = raw.trim().replace(/^\uFEFF/, '');
    if (!line || /^[#=━─]/.test(line)) return;
    const label = line.match(/^([^:：]+)[:：]\s*(.*)$/);
    if (label && labels[label[1]] && current) { current[labels[label[1]]] = label[2]; return; }
    line = line.replace(/^\d+[.、)）]\s*/, '').replace(/^[-*•]\s+/, '');
    let parts = line.split(/\t|\s*\|\s*/).map(s => s.trim()).filter(Boolean);
    if (parts.length === 1) parts = line.split(/\s+[—–-]\s+|\s*[:：]\s*/);
    if (parts.length === 1) { const match = line.match(/^([A-Za-z][^\u4e00-\u9fff]*?)\s*([\u4e00-\u9fff].*)$/); if (match) parts = [match[1].trim(), match[2]]; }
    const en = (parts[0] || '').trim();
    if (!en || !/[A-Za-z]/.test(en) || /[\u4e00-\u9fff]/.test(en)) return;
    current = { text: en, type: /[.!?]$/.test(en) || en.split(/\s+/).length >= 6 ? 'sentence' : /\s|-/.test(en) ? 'phrase' : 'word', translation: parts[1] || '', phonetic: '', roots: '', extension: '', example: parts[2] || '', exampleZh: parts[3] || '' };
    items.push(current);
  });
  return items;
}
module.exports = { parseText };
