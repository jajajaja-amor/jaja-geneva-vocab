const store = require('../../utils/store.js');
Page({
  data: { done: false, reveal: false },
  onShow() { this.render(); },
  render() { const s = store.get(), done = s.index >= s.queue.length, word = done ? null : store.word(s.queue[s.index]); const yes = done ? s.queue.map(id => store.word(id)).filter(w => w && s.outcomes[w.id] === 'remembered') : []; this.setData({ done, word, index: s.index, length: s.queue.length, batch: s.batch, todayCompleted: s.todayCompleted, yes: yes.length, no: s.queue.length - yes.length, reveal: this.data.reveal && !done }); },
  reveal() { this.setData({ reveal: !this.data.reveal }); },
  mark(e) { if (!this.data.word) return; store.mark(this.data.word.id, e.currentTarget.dataset.status, true); this.setData({ reveal: false }); this.render(); },
  move(e) { store.move(Number(e.currentTarget.dataset.step)); this.setData({ reveal: false }); this.render(); },
  nextBatch() { store.nextBatch(); this.render(); },
  restart() { store.restart(); this.render(); },
  detail() { wx.navigateTo({ url: `/pages/detail/index?id=${encodeURIComponent(this.data.word.id)}` }); }
});
