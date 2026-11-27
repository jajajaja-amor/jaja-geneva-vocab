import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const dist=path.join(root,'dist');
const output=path.resolve(root,'..','jaja-geneva-vocab-offline.html');
let html=await fs.readFile(path.join(dist,'index.html'),'utf8');
const styles=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m=>m[1]);
const scripts=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
if(styles.length!==2||scripts.length!==4)throw Error('入口资源数量变化，请更新离线导出脚本');
for(const name of styles){const css=(await fs.readFile(path.join(dist,name),'utf8')).replace(/<\/style/gi,'<\\/style');html=html.replace(`<link rel="stylesheet" href="${name}">`,`<style>\n${css}\n</style>`);}
for(const name of scripts){let js=await fs.readFile(path.join(dist,name),'utf8');if(name==='app.js')js=js.replace('async function enrichPreview(){',"async function enrichPreview(){if(location.protocol==='file:'){notify('离线版不调用 API；仍可直接导入词汇。');return;}");js=js.replace(/<\/script/gi,'<\\/script');html=html.replace(`<script src="${name}"></script>`,`<script>\n${js}\n</script>`);}
html=html.replace('<body>','<body><div style="background:#e7eef3;color:#0b3d5c;text-align:center;padding:8px 16px;font-size:14px">本地离线版 · 无需联网即可背诵与导入 · AI 补全需使用在线部署版</div>');
await fs.writeFile(output,html,'utf8');
console.log(`${output} (${Buffer.byteLength(html)} bytes)`);
