import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const output=path.resolve(root,'..','jaja-geneva-vocab-transfer.json');
const paths=[
  'dist/index.html','dist/style.css','dist/api-settings.css',
  'dist/vocab.js','dist/extra-vocab.js','dist/api-settings.js','dist/app.js',
  'enrich.mjs','server.mjs','package.json','.env.example'
];
const files={};
for(const name of paths)files[name]=await fs.readFile(path.join(root,name),'utf8');

const context=vm.createContext({});
vm.runInContext(files['dist/vocab.js'],context,{filename:'dist/vocab.js'});
vm.runInContext(files['dist/extra-vocab.js'],context,{filename:'dist/extra-vocab.js'});
const vocabulary=vm.runInContext('[...GENEVA_VOCAB,...EXTRA_VOCAB]',context);
if(vocabulary.length!==709)throw Error(`词库数量变化：${vocabulary.length}，请检查导出规则`);
const packageInfo=JSON.parse(files['package.json']);

const transfer={
  format:'jaja-geneva-vocab-portable-v1',
  exportedAt:new Date().toISOString(),
  name:'jaja的日内瓦突击计划',
  version:packageInfo.version,
  sourceRepository:'https://github.com/jajajaja-amor/jaja-geneva-vocab',
  purpose:'交给 WorkBuddy 或其他 AI，在你选择的中国大陆可访问环境中重建或继续修改网页版。',
  instructionsForAI:[
    '这是项目交接包。将 files 中每个键作为相对路径，将对应字符串按 UTF-8 原样写成文件。网页入口是 dist/index.html。',
    '静态部署时发布 dist 目录。请保留原有词库格式、页面功能、每日 50 词可连续开新组和今日累计规则。',
    'AI 补全是可选功能：如需启用，同域提供 POST /api/enrich，服务端逻辑见 enrich.mjs；DeepSeek API Key 只放在服务端环境变量中。',
    '没有任何 API 或网络时，词表、背诵、搜索、浏览器朗读、TXT 直接导入和本地备份仍须可用。',
    '如果要给中国大陆用户使用，请自行选择实际可达的托管、域名和合规方案，并用中国大陆网络与设备验证；不要把 Cloudflare workers.dev 的可达性当作保证。',
    '如果用户另给 JSON 学习备份，应保留其已导入词汇与进度。此交接包不含浏览器 localStorage 中的个人学习记录。'
  ],
  project:{
    entry:'dist/index.html',
    staticDirectory:'dist',
    optionalApiRoute:'POST /api/enrich',
    vocabularyCount:vocabulary.length,
    coreVocabularyCount:569,
    themeVocabularyCount:140,
    storage:'浏览器 localStorage；可在网页导出／恢复 JSON 学习备份',
    offlineCore:true,
    optionalDeepSeek:true,
    features:['词表与搜索','词条详情与浏览器英语朗读','每日 50 词连续批次与今日累计','七天学习曲线','英文|中文 TXT 导入','可选 DeepSeek 补全音标、拆解、解释和双语例句','JSON 学习备份']
  },
  vocabularyIndex:vocabulary.map(w=>({english:w.text,chinese:w.translation,collection:w.collection||'原有词库'})),
  files,
  excludes:['DeepSeek API Key','Cloudflare 登录凭证','词库补全访问口令','浏览器个人学习进度']
};
await fs.writeFile(output,JSON.stringify(transfer,null,2)+'\n','utf8');
console.log(`${output} (${Buffer.byteLength(JSON.stringify(transfer))} bytes JSON data; ${vocabulary.length} words; ${paths.length} source files)`);
