const store = require('../../utils/store.js');
const { parseText } = require('../../utils/parser.js');
let preview = [];
Page({
  data: { text: '', count: 0, sample: [], loading: false, apiBase: '', token: '', message: '' },
  onLoad() { try { this.setData({ apiBase: wx.getStorageSync('jaja-api-base') || '', token: wx.getStorageSync('jaja-api-token') || '' }); } catch (_) {} },
  input(e) { this.setData({ text: e.detail.value }); },
  apiInput(e) { this.setData({ apiBase: e.detail.value }); },
  tokenInput(e) { this.setData({ token: e.detail.value }); },
  saveApi() { const base = this.data.apiBase.trim().replace(/\/+$/, ''); if (base && !/^https:\/\//i.test(base)) { wx.showToast({ title: '请输入 HTTPS 地址', icon: 'none' }); return; } wx.setStorageSync('jaja-api-base', base); wx.setStorageSync('jaja-api-token', this.data.token.trim()); this.setData({ apiBase: base }); wx.showToast({ title: '已保存', icon: 'success' }); },
  chooseFile() {
    wx.chooseMessageFile({ count: 1, type: 'file', extension: ['txt'], success: result => {
      const file = result.tempFiles[0]; if (!file || file.size > 5 * 1024 * 1024) { wx.showToast({ title: '请选择 5MB 内的 TXT', icon: 'none' }); return; }
      wx.getFileSystemManager().readFile({ filePath: file.path, encoding: 'utf8', success: res => { this.setData({ text: res.data }); this.parse(); }, fail: () => wx.showToast({ title: '读取文件失败', icon: 'none' }) });
    } });
  },
  parse() { preview = parseText(this.data.text); this.showPreview(); },
  showPreview() { this.setData({ count: preview.length, sample: preview.slice(0, 20), message: preview.length ? `识别到 ${preview.length} 条词汇` : '未识别到英文词条' }); },
  import() { const result = store.importWords(preview); preview = []; this.setData({ count: 0, sample: [], message: `已导入 ${result.added} 条，跳过 ${result.skipped} 条重复词` }); wx.showToast({ title: '导入完成', icon: 'success' }); },
  enrich() {
    if (!preview.length) return;
    const base = this.data.apiBase.trim().replace(/\/+$/, '');
    if (!/^https:\/\//i.test(base)) { wx.showToast({ title: '先填写 HTTPS 接口地址', icon: 'none' }); return; }
    this.saveApi(); this.setData({ loading: true }); let done = 0;
    const next = () => {
      if (done >= preview.length) { this.showPreview(); this.setData({ loading: false, message: `已补全 ${done} 条，请核对后导入` }); return; }
      const group = preview.slice(done, done + 20);
      wx.request({ url: `${base}/api/enrich`, method: 'POST', header: { 'Content-Type': 'application/json', 'x-enrich-token': this.data.token.trim() }, data: { items: group }, success: res => {
        if (res.statusCode !== 200 || !res.data || !Array.isArray(res.data.items) || res.data.items.length !== group.length) { this.failEnrich(done, (res.data && res.data.error) || `HTTP ${res.statusCode}`); return; }
        group.forEach((w, i) => ['phonetic', 'roots', 'extension', 'example', 'exampleZh'].forEach(field => { if (!w[field]) w[field] = res.data.items[i] && res.data.items[i][field] || ''; }));
        done += group.length; this.showPreview(); next();
      }, fail: err => this.failEnrich(done, err.errMsg || '网络请求失败') });
    }; next();
  },
  failEnrich(done, reason) { this.showPreview(); this.setData({ loading: false, message: `已补全 ${done} 条；${reason}。仍可直接导入基础词条。` }); },
  backup() { const data = JSON.stringify(store.get(), null, 2); const path = `${wx.env.USER_DATA_PATH}/jaja-geneva-backup.json`; wx.getFileSystemManager().writeFile({ filePath: path, data, encoding: 'utf8', success: () => wx.shareFileMessage({ filePath: path, fileName: '日内瓦学习备份.json' }), fail: () => wx.showToast({ title: '备份失败', icon: 'none' }) }); },
  restore() { wx.chooseMessageFile({ count: 1, type: 'file', extension: ['json'], success: res => { const file = res.tempFiles[0]; if (!file || file.size > 10 * 1024 * 1024) { wx.showToast({ title: '备份文件过大', icon: 'none' }); return; } wx.getFileSystemManager().readFile({ filePath: file.path, encoding: 'utf8', success: content => { try { const backup = JSON.parse(content.data); wx.showModal({ title: '恢复备份', content: '将替换小程序当前学习数据。建议先导出当前备份。', success: answer => { if (answer.confirm) { try { store.replace(backup); wx.showToast({ title: '恢复成功', icon: 'success' }); } catch (e) { wx.showToast({ title: e.message, icon: 'none' }); } } } }); } catch (_) { wx.showToast({ title: '备份格式不正确', icon: 'none' }); } }, fail: () => wx.showToast({ title: '读取失败', icon: 'none' }) }); } }); }
});
