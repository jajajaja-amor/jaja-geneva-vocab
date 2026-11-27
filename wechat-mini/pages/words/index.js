const store = require('../../utils/store.js');
Page({
  data: { query: '', filter: 'all', collection: 'all', filters: [{ value: 'all', label: '全部' }, { value: 'new', label: '未学' }, { value: 'forgotten', label: '待复习' }, { value: 'remembered', label: '已记住' }], collections: [], list: [], total: 0, page: 0, counts: {}, todayCompleted: 0 },
  onShow() { this.render(); },
  input(e) { this.setData({ query: e.detail.value, page: 0 }); this.render(); },
  filter(e) { this.setData({ filter: e.currentTarget.dataset.value, page: 0 }); this.render(); },
  collection(e) { this.setData({ collection: e.currentTarget.dataset.value, page: 0 }); this.render(); },
  page(e) { this.setData({ page: Math.max(0, this.data.page + Number(e.currentTarget.dataset.step)) }); this.render(); },
  open(e) { wx.navigateTo({ url: `/pages/detail/index?id=${encodeURIComponent(e.currentTarget.dataset.id)}` }); },
  daily() { wx.switchTab({ url: '/pages/daily/index' }); },
  render() {
    const s = store.get(), q = this.data.query.toLowerCase();
    const all = s.items.filter(w => (this.data.filter === 'all' || w.status === this.data.filter) && (this.data.collection === 'all' || (w.collection || '原有词库') === this.data.collection) && [w.text, w.translation, w.roots].some(v => String(v || '').toLowerCase().includes(q)));
    const maxPage = Math.max(0, Math.ceil(all.length / 30) - 1), page = Math.min(this.data.page, maxPage);
    const collections = ['all', ...new Set(s.items.map(w => w.collection || '原有词库'))];
    this.setData({ list: all.slice(page * 30, page * 30 + 30), total: all.length, page, maxPage, collections, todayCompleted: s.todayCompleted, counts: { all: s.items.length, remembered: s.items.filter(w => w.status === 'remembered').length, forgotten: s.items.filter(w => w.status === 'forgotten').length, new: s.items.filter(w => w.status === 'new').length } });
  }
});
