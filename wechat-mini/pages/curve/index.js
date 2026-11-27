const store = require('../../utils/store.js');
Page({
  data: { days: [] },
  onShow() { this.render(); },
  render() { const days = store.lastSevenDays(), max = Math.max(1, ...days.map(d => Math.max(d.remembered, d.forgotten))); this.setData({ days: days.map(d => ({ ...d, label: d.date.slice(8), rememberedHeight: Math.max(4, Math.round(d.remembered / max * 170)), forgottenHeight: Math.max(4, Math.round(d.forgotten / max * 170)) })), total: days.reduce((n, d) => n + d.studied, 0) }); },
  reset() { wx.showModal({ title: '重置学习进度', content: '清空学习标记和曲线？词库与已导入词条会保留。', success: res => { if (res.confirm) { store.resetProgress(); this.render(); } } }); }
});
