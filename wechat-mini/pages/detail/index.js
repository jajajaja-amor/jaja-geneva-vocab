const store = require('../../utils/store.js');
Page({
  data: {},
  onLoad(options) { this.id = decodeURIComponent(options.id || ''); this.render(); },
  onShow() { if (this.id) this.render(); },
  render() { this.setData({ word: store.word(this.id) }); },
  mark(e) { store.mark(this.id, e.currentTarget.dataset.status, false); this.render(); wx.showToast({ title: '已记录', icon: 'success' }); }
});
