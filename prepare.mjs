import fs from 'node:fs/promises';
import vm from 'node:vm';
const code=await fs.readFile(new URL('./reference/709-1fcef8c8c980c6cc.js',import.meta.url),'utf8');
const start=code.indexOf('let r=[')+6,end=code.indexOf('],s="jaja-geneva',start)+1;
if(start<6||end<start)throw Error('Vocabulary source marker missing');
const words=vm.runInNewContext('('+code.slice(start,end)+')',Object.create(null),{timeout:1000});
if(!Array.isArray(words)||words.some(w=>!w.text))throw Error('Invalid source vocabulary');
await fs.writeFile(new URL('./dist/vocab.js',import.meta.url),'const GENEVA_VOCAB = '+JSON.stringify(words,null,2)+';\n');
console.log('Vocabulary entries:',words.length);
