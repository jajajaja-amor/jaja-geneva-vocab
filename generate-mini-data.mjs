import fs from 'node:fs';
import vm from 'node:vm';

const context = vm.createContext({});
for (const file of ['dist/vocab.js', 'dist/extra-vocab.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
}
const words = vm.runInContext('GENEVA_VOCAB.map((w,i)=>({...w,id:"w"+i,status:"new"})).concat(EXTRA_VOCAB)', context);
fs.mkdirSync('wechat-mini/data', { recursive: true });
fs.writeFileSync('wechat-mini/data/vocab.js', `// Generated from dist/vocab.js and dist/extra-vocab.js.\nmodule.exports = ${JSON.stringify(words, null, 2)};\n`);
console.log(`Generated ${words.length} WeChat vocabulary entries.`);
